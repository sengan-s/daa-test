import { Problem } from '../types';

export const PROBLEMS: Problem[] = [
  {
    id: 'merge-sorted-array',
    title: '1. Merge Sorted Array',
    marks: 15,
    description: `You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, representing the number of elements in nums1 and nums2 respectively.

Merge nums1 and nums2 into a single array sorted in non-decreasing order.

The final sorted array should not be returned by the function — instead it must be stored inside nums1. To accommodate this, nums1 has a length of m + n, where the first m elements are the elements to be merged and the last n elements are 0 placeholders to be ignored/overwritten. nums2 has a length of n.`,
    inputFormat: `nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3`,
    outputFormat: `[1, 2, 2, 3, 5, 6]`,
    constraints: [
      'nums1.length == m + n',
      'nums2.length == n',
      '0 <= m, n <= 200',
      '1 <= m + n <= 200',
      '-10^9 <= nums1[i], nums2[j] <= 10^9'
    ],
    starterCode: {
      java: `public class Solution {
    public static void merge(int[] nums1, int m, int[] nums2, int n) {
        // Modify nums1 in-place, do not return anything
    }
}`,
      python: `class Solution:
    def merge(self, nums1: list[int], m: int, nums2: list[int], n: int) -> None:
        # Modify nums1 in-place, do not return anything
        pass`,
      c: `#include <stdio.h>

void merge(int* nums1, int nums1Size, int m, int* nums2, int nums2Size, int n) {
    // Modify nums1 in-place, do not return anything
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
        // Modify nums1 in-place, do not return anything
    }
};`
    },
    visibleTestCases: [
      {
        id: 'msa-v1',
        input: 'nums1=[1,2,3,0,0,0], m=3, nums2=[2,5,6], n=3',
        expectedOutput: '[1, 2, 2, 3, 5, 6]',
        isHidden: false,
        explanation: 'The arrays being merged are [1,2,3] and [2,5,6]. Result stored in nums1: [1,2,2,3,5,6].'
      },
      {
        id: 'msa-v2',
        input: 'nums1=[1], m=1, nums2=[], n=0',
        expectedOutput: '[1]',
        isHidden: false,
        explanation: 'nums2 is empty, nums1 remains [1].'
      },
      {
        id: 'msa-v3',
        input: 'nums1=[0], m=0, nums2=[1], n=1',
        expectedOutput: '[1]',
        isHidden: false,
        explanation: 'm = 0 means nums1 has no active elements. Merging nums2 gives [1].'
      }
    ],
    hiddenTestCases: [
      {
        id: 'msa-h1',
        input: 'nums1=[4,5,6,0,0,0], m=3, nums2=[1,2,3], n=3',
        expectedOutput: '[1, 2, 3, 4, 5, 6]',
        isHidden: true
      },
      {
        id: 'msa-h2',
        input: 'nums1=[0,0,0,0], m=0, nums2=[1,2,3,4], n=4',
        expectedOutput: '[1, 2, 3, 4]',
        isHidden: true
      }
    ]
  },
  {
    id: 'binary-search',
    title: '2. Binary Search',
    marks: 15,
    description: `Given an array of integers arr sorted in non-decreasing order, and an integer target, write a function to search target in arr.

If target exists, return its 0-based index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.`,
    inputFormat: `arr = [1,3,5,7,9,11], target = 7`,
    outputFormat: `3`,
    constraints: [
      '1 <= arr.length <= 10^4',
      '-10^4 <= arr[i], target <= 10^4',
      'All integers in arr are unique.',
      'arr is sorted in ascending order.'
    ],
    starterCode: {
      java: `public class Solution {
    public static int binarySearch(int[] arr, int target) {
        // Write your code here
        return -1;
    }
}`,
      python: `class Solution:
    def binarySearch(self, arr: list[int], target: int) -> int:
        # Write your code here
        return -1`,
      c: `#include <stdio.h>

int binarySearch(int* arr, int arrSize, int target) {
    // Write your code here
    return -1;
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int binarySearch(vector<int>& arr, int target) {
        // Write your code here
        return -1;
    }
};`
    },
    visibleTestCases: [
      {
        id: 'bs-v1',
        input: 'arr=[1,3,5,7,9,11], target=7',
        expectedOutput: '3',
        isHidden: false,
        explanation: '7 exists in arr and its index is 3.'
      },
      {
        id: 'bs-v2',
        input: 'arr=[2,4,6,8], target=5',
        expectedOutput: '-1',
        isHidden: false,
        explanation: '5 does not exist in arr, so return -1.'
      },
      {
        id: 'bs-v3',
        input: 'arr=[10], target=10',
        expectedOutput: '0',
        isHidden: false,
        explanation: 'Single element match at index 0.'
      }
    ],
    hiddenTestCases: [
      {
        id: 'bs-h1',
        input: 'arr=[], target=1',
        expectedOutput: '-1',
        isHidden: true
      },
      {
        id: 'bs-h2',
        input: 'arr=[1,2,3,4,5], target=1',
        expectedOutput: '0',
        isHidden: true
      }
    ]
  },
  {
    id: 'matrix-multiplication',
    title: '3. Matrix Multiplication',
    marks: 20,
    description: `Given two 2D integer matrices A of size (m x n) and B of size (n x p), compute and return their product matrix C = A x B of size (m x p).

Each element C[i][j] is calculated as the dot product of row i of A and column j of B:
C[i][j] = sum(A[i][k] * B[k][j]) for k from 0 to n-1.`,
    inputFormat: `A = [[1,2],[3,4]], B = [[5,6],[7,8]]`,
    outputFormat: `[[19, 22], [43, 50]]`,
    constraints: [
      '1 <= m, n, p <= 100',
      '-100 <= A[i][j], B[i][j] <= 100',
      'The number of columns in A equals the number of rows in B.'
    ],
    starterCode: {
      java: `public class Solution {
    public static int[][] multiply(int[][] A, int[][] B) {
        // Write your code here
        return new int[0][0];
    }
}`,
      python: `class Solution:
    def multiply(self, A: list[list[int]], B: list[list[int]]) -> list[list[int]]:
        # Write your code here
        return []`,
      c: `#include <stdio.h>
#include <stdlib.h>

int** multiply(int** A, int aRows, int aCols, int** B, int bRows, int bCols, int* returnRows, int* returnCols) {
    // Write your code here
    return NULL;
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<vector<int>> multiply(vector<vector<int>>& A, vector<vector<int>>& B) {
        // Write your code here
        return {};
    }
};`
    },
    visibleTestCases: [
      {
        id: 'mm-v1',
        input: 'A=[[1,2],[3,4]], B=[[5,6],[7,8]]',
        expectedOutput: '[[19, 22], [43, 50]]',
        isHidden: false,
        explanation: 'Standard 2x2 matrix multiplication.'
      },
      {
        id: 'mm-v2',
        input: 'A=[[1,0],[0,1]], B=[[2,3],[4,5]]',
        expectedOutput: '[[2, 3], [4, 5]]',
        isHidden: false,
        explanation: 'Identity matrix multiplication.'
      },
      {
        id: 'mm-v3',
        input: 'A=[[1,2,3]], B=[[1],[1],[1]]',
        expectedOutput: '[[6]]',
        isHidden: false,
        explanation: 'Row vector times column vector gives 1x1 matrix [[6]].'
      }
    ],
    hiddenTestCases: [
      {
        id: 'mm-h1',
        input: 'A=[[2]], B=[[3]]',
        expectedOutput: '[[6]]',
        isHidden: true
      },
      {
        id: 'mm-h2',
        input: 'A=[[1,1],[1,1]], B=[[1,1],[1,1]]',
        expectedOutput: '[[2, 2], [2, 2]]',
        isHidden: true
      }
    ]
  }
];
