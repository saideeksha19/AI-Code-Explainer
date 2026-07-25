import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateCodeExplanation, generateVulnerabilityRemediation, scanFileForVulnerabilities } from '../services/geminiService';
import { Explanation } from '../models/Explanation';
import mongoose from 'mongoose';

export async function scanFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { fileName, fileContent } = req.body;
    if (!fileName || !fileContent) {
      return res.status(400).json({ error: 'Both fileName and fileContent are required.' });
    }

    const scanResult = await scanFileForVulnerabilities(fileName, fileContent);
    res.json(scanResult);
  } catch (error) {
    next(error);
  }
}

export async function proxyGithubZip(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { githubUrl } = req.query;
    if (!githubUrl || typeof githubUrl !== 'string') {
      return res.status(400).json({ error: 'githubUrl query parameter is required.' });
    }

    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL format.' });
    }

    const [_, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');
    const downloadUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/zipball`;

    console.log(`Proxying GitHub ZIP download from: ${downloadUrl}`);
    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'aistudio-build-copilot',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch ZIP from GitHub: ${response.statusText}. Please verify the repository is public.`
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanRepo}.zip"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

export async function remediateVulnerability(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { vulnerabilityType, beforeCode, fileName, customPrompt } = req.body;
    if (!beforeCode) {
      return res.status(400).json({ error: 'Vulnerable code snippet (beforeCode) is required.' });
    }

    const remediationResult = await generateVulnerabilityRemediation({
      vulnerabilityType,
      beforeCode,
      fileName,
      customPrompt,
    });

    res.json(remediationResult);
  } catch (error) {
    next(error);
  }
}


export async function explainCode(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, language, mode, targetLanguage } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code content is required for explanation.' });
    }

    // Generate explanation using Gemini API service
    const analysisResult = await generateCodeExplanation({
      code,
      language,
      mode,
      targetLanguage,
    });

    // Check if Mongo is connected and we can save the history
    if (mongoose.connection.readyState === 1) {
      try {
        // Create dynamic title from the first code line or a default title
        const cleanCode = code.trim();
        const firstLine = cleanCode.split('\n')[0].replace(/[\/*#]/g, '').trim();
        const title = firstLine.substring(0, 30) || `${mode.toUpperCase()} Analysis`;

        const savedExplanation = await Explanation.create({
          userId: req.user ? req.user.id : undefined,
          title,
          code,
          language,
          mode,
          targetLanguage,
          result: analysisResult,
        });

        return res.json({
          ...analysisResult,
          recordId: savedExplanation._id,
        });
      } catch (saveError) {
        console.error('Failed to log explanation history in MongoDB:', saveError);
        // Continue and return result even if mongo save failed so user isn't blocked
      }
    }

    // Return analyzed response without DB logger fallback
    res.json(analysisResult);
  } catch (error) {
    next(error);
  }
}

export async function getUserHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.json([]); // Return empty history array if offline
    }

    const history = await Explanation.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(history);
  } catch (error) {
    next(error);
  }
}

export async function deleteHistoryItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'History ID is required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database offline. Action unavailable.' });
    }

    const item = await Explanation.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'History record not found.' });
    }

    // Verify ownership
    if (req.user && item.userId && item.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this record' });
    }

    await Explanation.findByIdAndDelete(id);
    res.json({ success: true, message: 'Record deleted.' });
  } catch (error) {
    next(error);
  }
}
