import { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  ChevronDown, 
  ChevronRight, 
  X,
  FileCode2,
  FolderTree
} from 'lucide-react';
import { Vulnerability } from './SecurityData';

interface FileTreeExplorerProps {
  vulnerabilities: Vulnerability[];
  scannedFilesList: Array<{ path: string; status: 'secure' | 'vulnerable' | 'error'; vulnerabilitiesCount: number }>;
  selectedTreePath: string | null;
  onSelectTreePath: (path: string | null) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: Record<string, TreeNode>;
  vulnCount: number;
}

export default function FileTreeExplorer({
  vulnerabilities,
  scannedFilesList,
  selectedTreePath,
  onSelectTreePath
}: FileTreeExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Memoized folder tree builder
  const fileTree = useMemo(() => {
    const rootNode: Record<string, TreeNode> = {};

    // Collect all paths with their respective vulnerability count
    const pathsWithVulns: Record<string, number> = {};

    // 1. Compile path vulnerability densities from active vulnerability records
    vulnerabilities.forEach(v => {
      pathsWithVulns[v.fileName] = (pathsWithVulns[v.fileName] || 0) + (v.status === 'Needs Review' ? 1 : 0);
    });

    // 2. Map scanned clean list so they show up in tree too
    scannedFilesList.forEach(f => {
      if (f.path && pathsWithVulns[f.path] === undefined) {
        pathsWithVulns[f.path] = 0; // 0 open threats
      }
    });

    // Fallbacks if lists are empty
    if (Object.keys(pathsWithVulns).length === 0) {
      pathsWithVulns['src/backend/config/jwt.ts'] = 1;
      pathsWithVulns['src/backend/middleware/rateLimiter.ts'] = 1;
      pathsWithVulns['src/backend/controllers/authController.ts'] = 1;
      pathsWithVulns['server.ts'] = 0;
    }

    // Parse each file path and insert recursively into the tree node maps
    Object.entries(pathsWithVulns).forEach(([filePath, count]) => {
      const parts = filePath.split('/');
      let currentLevel = rootNode;
      let cumulativePath = '';

      parts.forEach((part, index) => {
        cumulativePath = cumulativePath ? `${cumulativePath}/${part}` : part;
        const isLastPart = index === parts.length - 1;

        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            path: cumulativePath,
            isFolder: !isLastPart,
            children: {},
            vulnCount: 0
          };
        }

        currentLevel[part].vulnCount += count;
        currentLevel = currentLevel[part].children;
      });
    });

    return rootNode;
  }, [vulnerabilities, scannedFilesList]);

  // Recursively render node items
  const renderNode = (node: TreeNode, depth = 0) => {
    const isFolder = node.isFolder;
    const path = node.path;
    const isExpanded = expandedFolders[path] !== false; // folders open by default
    const isSelected = selectedTreePath === path;
    const hasIssues = node.vulnCount > 0;

    const toggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedFolders(prev => ({
        ...prev,
        [path]: !isExpanded
      }));
    };

    const handleNodeSelect = () => {
      if (isSelected) {
        onSelectTreePath(null); // deselect to show all
      } else {
        onSelectTreePath(path);
      }
    };

    return (
      <div key={path} className="select-none">
        <div
          onClick={handleNodeSelect}
          className={`group flex items-center justify-between py-1.5 px-2.5 rounded-lg cursor-pointer transition-all text-xs ${
            isSelected
              ? 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 font-bold border-l-2 border-violet-500 shadow-sm'
              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300'
          }`}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isFolder ? (
              <button
                type="button"
                onClick={toggleExpand}
                className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400 dark:text-zinc-500 shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span className="w-3.5 h-3.5 flex items-center justify-center text-zinc-400 shrink-0">
                <FileCode className="w-3 h-3" />
              </span>
            )}

            {isFolder ? (
              isExpanded ? (
                <FolderOpen className={`w-4 h-4 shrink-0 ${isSelected ? 'text-violet-500' : 'text-amber-500/85'}`} />
              ) : (
                <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-violet-500' : 'text-amber-500/85'}`} />
              )
            ) : (
              <FileCode2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-violet-500' : 'text-violet-400/80'}`} />
            )}

            <span className="truncate pr-1 text-[11px] font-mono" title={node.name}>
              {node.name}
            </span>
          </div>

          {hasIssues && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 leading-none ${
                isSelected
                  ? 'bg-violet-500 text-white'
                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              }`}
            >
              {node.vulnCount}
            </span>
          )}
        </div>

        {isFolder && isExpanded && (
          <div className="mt-0.5">
            {Object.values(node.children).map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden flex flex-col h-full min-h-[300px]">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-violet-500" />
          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
            Scanned Repository Trees
          </h3>
        </div>
        {selectedTreePath && (
          <button
            type="button"
            onClick={() => onSelectTreePath(null)}
            className="flex items-center gap-1 text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 py-1 rounded-md"
          >
            <span>Reset</span>
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      <div className="p-3 flex-1 overflow-y-auto max-h-[400px] space-y-1 custom-scrollbar">
        {Object.keys(fileTree).length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-xs">
            No source files loaded yet.
          </div>
        ) : (
          Object.values(fileTree).map((node) => renderNode(node))
        )}
      </div>

      {selectedTreePath && (
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-850 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
          Active Filter: <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">{selectedTreePath}</span>
        </div>
      )}
    </div>
  );
}
