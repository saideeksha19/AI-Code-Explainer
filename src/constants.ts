import { LanguageOption, AnalysisMode } from './types';

export const LANGUAGES: LanguageOption[] = [
  {
    value: 'javascript',
    label: 'JavaScript',
    extension: 'js',
    defaultSnippet: `// JavaScript: Find the longest subarray with sum less than or equal to k
function longestSubarray(nums, k) {
  let maxLength = 0;
  let currentSum = 0;
  let left = 0;
  
  for (let right = 0; right < nums.length; right++) {
    currentSum += nums[right];
    
    while (currentSum > k) {
      currentSum -= nums[left];
      left++;
    }
    
    maxLength = Math.max(maxLength, right - left + 1);
  }
  
  return maxLength;
}

// Test case
console.log(longestSubarray([3, 1, 2, 1, 4, 5], 7));
`
  },
  {
    value: 'typescript',
    label: 'TypeScript',
    extension: 'ts',
    defaultSnippet: `// TypeScript: LRU (Least Recently Used) Cache Implementation
class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  public get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    
    // Refresh item: remove and re-insert to put at the end
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  public put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Least recently used is the first item in the Map keys iterator
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }
}
`
  },
  {
    value: 'python',
    label: 'Python',
    extension: 'py',
    defaultSnippet: `# Python: Dynamic Programming - Knapsack Problem (0/1)
def solve_knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0 for _ in range(capacity + 1)] for _ in range(n + 1)]
    
    for i in range(1, n + 1):
        for w in range(1, capacity + 1):
            if weights[i-1] <= w:
                dp[i][w] = max(
                    values[i-1] + dp[i-1][w - weights[i-1]],
                    dp[i-1][w]
                )
            else:
                dp[i][w] = dp[i-1][w]
                
    return dp[n][capacity]

# Test Case
weights = [1, 2, 3, 5]
values = [1, 6, 10, 16]
capacity = 7
print(f"Max Value: {solve_knapsack(weights, values, capacity)}")
`
  },
  {
    value: 'java',
    label: 'Java',
    extension: 'java',
    defaultSnippet: `// Java: Recursive Binary Search Implementation
public class BinarySearch {
    public static int search(int[] arr, int target) {
        return binarySearch(arr, target, 0, arr.length - 1);
    }

    private static int binarySearch(int[] arr, int target, int left, int right) {
        if (left > right) return -1;
        
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        
        if (arr[mid] > target) {
            return binarySearch(arr, target, left, mid - 1);
        }
        return binarySearch(arr, target, mid + 1, right);
    }

    public static void main(String[] args) {
        int[] sortedArray = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        int target = 23;
        int result = search(sortedArray, target);
        System.out.println("Element found at index: " + result);
    }
}
`
  },
  {
    value: 'c',
    label: 'C',
    extension: 'c',
    defaultSnippet: `// C: Standard Bubble Sort Algorithm
#include <stdio.h>

void bubbleSort(int arr[], int n) {
    int i, j, temp;
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - j - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap elements
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    bubbleSort(arr, n);
    printf("Sorted array: \\n");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    return 0;
}
`
  },
  {
    value: 'cpp',
    label: 'C++',
    extension: 'cpp',
    defaultSnippet: `// C++: Custom Smart Pointer implementation (Ref Counting)
#include <iostream>

template <typename T>
class SimpleSharedPtr {
private:
    T* ptr;
    int* refCount;

public:
    explicit SimpleSharedPtr(T* p = nullptr) : ptr(p) {
        refCount = new int(1);
    }

    // Copy Constructor
    SimpleSharedPtr(const SimpleSharedPtr<T>& other) {
        ptr = other.ptr;
        refCount = other.refCount;
        if (ptr) {
            (*refCount)++;
        }
    }

    // Destructor
    ~SimpleSharedPtr() {
        if (--(*refCount) == 0) {
            delete ptr;
            delete refCount;
            std::cout << "Resource deleted!\\n";
        }
    }

    T& operator*() { return *ptr; }
    T* operator->() { return ptr; }
    int getCount() const { return *refCount; }
};
`
  },
  {
    value: 'go',
    label: 'Go',
    extension: 'go',
    defaultSnippet: `package main

import (
	"fmt"
	"sync"
)

// Go: Concurrent Worker Pool Pattern
func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for j := range jobs {
		fmt.Printf("worker %d started job %d\\n", id, j)
		// Perform heavy simulation
		fib := calculateFibonacci(j)
		results <- fib
		fmt.Printf("worker %d finished job %d\\n", id, j)
	}
}

func calculateFibonacci(n int) int {
	if n <= 1 {
		return n
	}
	return calculateFibonacci(n-1) + calculateFibonacci(n-2)
}

func main() {
	const numJobs = 10
	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)
	var wg sync.WaitGroup

	// Start 3 workers
	for w := 1; w <= 3; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	// Send 10 jobs
	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs)

	// Wait for workers to finish
	wg.Wait()
	close(results)

	// Gather results
	for r := range results {
		fmt.Println("Result:", r)
	}
}
`
  },
  {
    value: 'rust',
    label: 'Rust',
    extension: 'rs',
    defaultSnippet: `// Rust: Safe memory, Iterators, and pattern matching
fn find_first_vowel_index(text: &str) -> Option<usize> {
    let vowels = ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'];
    
    text.chars()
        .enumerate()
        .find(|(_, c)| vowels.contains(c))
        .map(|(index, _)| index)
}

fn main() {
    let sentence = String::from("Rust programming language");
    match find_first_vowel_index(&sentence) {
        Some(idx) => println!("First vowel found at index: {}", idx),
        None => println!("No vowels found!"),
    }
}
`
  },
  {
    value: 'php',
    label: 'PHP',
    extension: 'php',
    defaultSnippet: `<?php
// PHP: Simple REST API endpoint simulator (MVC pattern)
class UserController {
    private $users = [
        1 => ['name' => 'Alice', 'role' => 'Admin'],
        2 => ['name' => 'Bob', 'role' => 'Editor']
    ];

    public function getUserById($id) {
        if (isset($this->users[$id])) {
            return json_encode([
                'status' => 'success',
                'data' => $this->users[$id]
            ]);
        }
        
        http_response_code(404);
        return json_encode([
            'status' => 'error',
            'message' => 'User not found'
        ]);
    }
}

$controller = new UserController();
echo $controller->getUserById(1);
?>
`
  },
  {
    value: 'csharp',
    label: 'C#',
    extension: 'cs',
    defaultSnippet: `// C#: Async/Await Task and LINQ operations
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CSharpDemo {
    public class Program {
        public static async Task Main(string[] args) {
            Console.WriteLine("Fetching user records...");
            var users = await FetchUsersAsync();
            
            // Querying with LINQ
            var activeAdmins = users
                .Where(u => u.IsActive && u.Role == "Admin")
                .OrderBy(u => u.Name)
                .ToList();

            foreach (var user in activeAdmins) {
                Console.WriteLine($"Admin: {user.Name} ({user.Email})");
            }
        }

        private static async Task<List<User>> FetchUsersAsync() {
            await Task.Delay(500); // Simulate network latency
            return new List<User> {
                new User { Name = "Alice", Email = "alice@test.com", IsActive = true, Role = "Admin" },
                new User { Name = "Bob", Email = "bob@test.com", IsActive = false, Role = "User" },
                new User { Name = "Charlie", Email = "charlie@test.com", IsActive = true, Role = "Admin" }
            };
        }
    }

    public class User {
        public string Name { get; set; }
        public string Email { get; set; }
        public bool IsActive { get; set; }
        public string Role { get; set; }
    }
}
`
  },
  {
    value: 'sql',
    label: 'SQL',
    extension: 'sql',
    defaultSnippet: `-- SQL: Complex window functions & common table expressions (CTEs)
WITH MonthlySales AS (
  SELECT 
    product_id,
    DATE_TRUNC('month', sale_date) AS sales_month,
    SUM(quantity * unit_price) AS total_revenue,
    COUNT(sale_id) AS total_orders
  FROM order_items
  JOIN orders ON order_items.order_id = orders.order_id
  WHERE order_status = 'COMPLETED'
  GROUP BY product_id, DATE_TRUNC('month', sale_date)
),
RankedSales AS (
  SELECT
    product_id,
    sales_month,
    total_revenue,
    RANK() OVER (PARTITION BY sales_month ORDER BY total_revenue DESC) AS sales_rank,
    LAG(total_revenue, 1) OVER (PARTITION BY product_id ORDER BY sales_month) AS prev_month_revenue
  FROM MonthlySales
)
SELECT 
  p.product_name,
  s.sales_month,
  s.total_revenue,
  s.sales_rank,
  s.prev_month_revenue,
  ROUND(((s.total_revenue - s.prev_month_revenue) / s.prev_month_revenue) * 100, 2) AS mom_growth_percentage
FROM RankedSales s
JOIN products p ON s.product_id = p.id
WHERE s.sales_rank <= 5
ORDER BY s.sales_month DESC, s.sales_rank ASC;
`
  }
];

export interface ModeConfig {
  id: AnalysisMode;
  title: string;
  description: string;
  color: string;
  icon: string;
  actionText: string;
}

export const MODES: ModeConfig[] = [
  {
    id: 'explain',
    title: 'Explain Code',
    description: 'Get a clear, comprehensive breakdown of what this code does and how it executes.',
    color: 'emerald',
    icon: 'BookOpen',
    actionText: 'Explain'
  },
  {
    id: 'optimize',
    title: 'Optimize',
    description: 'Find performance bottlenecks and retrieve a cleaner, faster version of your code.',
    color: 'amber',
    icon: 'Zap',
    actionText: 'Optimize'
  },
  {
    id: 'comments',
    title: 'Write Comments',
    description: 'Generate rich JSDoc/docstring comments and inline documentation automatically.',
    color: 'sky',
    icon: 'MessageSquareText',
    actionText: 'Document'
  },
  {
    id: 'debug',
    title: 'Debug & Fix',
    description: 'Identify logic issues, edge case errors, and security concerns with clear solutions.',
    color: 'rose',
    icon: 'Bug',
    actionText: 'Debug'
  },
  {
    id: 'convert',
    title: 'Convert Language',
    description: 'Translate this source code into an idiomatic equivalent in another target programming language.',
    color: 'violet',
    icon: 'Languages',
    actionText: 'Convert'
  },
  {
    id: 'explain-errors',
    title: 'Explain Errors',
    description: 'Analyze an error message or stack trace and explain why it happened and how to fix it.',
    color: 'red',
    icon: 'AlertTriangle',
    actionText: 'Explain Error'
  },
  {
    id: 'generate-docs',
    title: 'Generate Docs',
    description: 'Create comprehensive markdown documentation for the provided code.',
    color: 'teal',
    icon: 'FileText',
    actionText: 'Document'
  },
  {
    id: 'generate-tests',
    title: 'Generate Tests',
    description: 'Generate unit tests covering edge cases and core logic.',
    color: 'green',
    icon: 'TestTube',
    actionText: 'Test'
  },
  {
    id: 'code-review',
    title: 'Code Review',
    description: 'Get a professional code review with suggestions for best practices.',
    color: 'indigo',
    icon: 'Eye',
    actionText: 'Review'
  },
  {
    id: 'code-smells',
    title: 'Code Smells',
    description: 'Detect code smells and anti-patterns with refactoring advice.',
    color: 'orange',
    icon: 'Activity',
    actionText: 'Sniff'
  },
  {
    id: 'time-complexity',
    title: 'Time Complexity',
    description: 'Analyze the Big-O time complexity of the provided code.',
    color: 'fuchsia',
    icon: 'Clock',
    actionText: 'Analyze Time'
  },
  {
    id: 'space-complexity',
    title: 'Space Complexity',
    description: 'Analyze the Big-O space/memory complexity of the provided code.',
    color: 'cyan',
    icon: 'Database',
    actionText: 'Analyze Space'
  },
  {
    id: 'refactor',
    title: 'Refactor',
    description: 'Refactor code to be cleaner, more modular, and idiomatic.',
    color: 'blue',
    icon: 'Wrench',
    actionText: 'Refactor'
  }
];
