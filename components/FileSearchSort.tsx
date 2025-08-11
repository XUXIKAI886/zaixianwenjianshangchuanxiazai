'use client';

import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileSearchSortProps, FilterOptions } from '@/lib/types';

export function FileSearchSort({
  onFilterChange,
  totalCount,
  filteredCount,
}: FileSearchSortProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<FilterOptions['sortBy']>('uploadTime');
  const [sortOrder, setSortOrder] = useState<FilterOptions['sortOrder']>('desc');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // 搜索关键词防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 当筛选条件改变时通知父组件
  useEffect(() => {
    const filters: FilterOptions = {
      searchTerm: debouncedSearchTerm,
      sortBy,
      sortOrder,
    };
    
    onFilterChange(filters);
  }, [debouncedSearchTerm, sortBy, sortOrder, onFilterChange]);

  // 处理排序字段变更
  const handleSortByChange = (field: FilterOptions['sortBy']) => {
    if (field === sortBy) {
      // 如果点击的是当前排序字段，则切换排序方向
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果是新字段，则使用默认排序方向
      setSortBy(field);
      setSortOrder(field === 'uploadTime' ? 'desc' : 'asc');
    }
  };

  // 获取排序按钮的图标
  const getSortIcon = (field: FilterOptions['sortBy']) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // 获取排序按钮的状态
  const getSortButtonVariant = (field: FilterOptions['sortBy']) => {
    return sortBy === field ? 'default' : 'outline';
  };

  // 清空搜索
  const clearSearch = () => {
    setSearchTerm('');
  };

  // 重置所有筛选条件
  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('uploadTime');
    setSortOrder('desc');
  };

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索文件名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-gray-100"
            >
              ×
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="whitespace-nowrap"
          >
            <Filter className="h-4 w-4 mr-2" />
            重置
          </Button>
        </div>
      </div>

      {/* 排序选项 */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <span className="text-sm text-gray-600 whitespace-nowrap">排序方式:</span>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={getSortButtonVariant('fileName')}
            size="sm"
            onClick={() => handleSortByChange('fileName')}
            className="flex items-center gap-2"
          >
            文件名
            {getSortIcon('fileName')}
          </Button>
          <Button
            variant={getSortButtonVariant('uploadTime')}
            size="sm"
            onClick={() => handleSortByChange('uploadTime')}
            className="flex items-center gap-2"
          >
            上传时间
            {getSortIcon('uploadTime')}
          </Button>
          <Button
            variant={getSortButtonVariant('fileSize')}
            size="sm"
            onClick={() => handleSortByChange('fileSize')}
            className="flex items-center gap-2"
          >
            文件大小
            {getSortIcon('fileSize')}
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-3">
        <div className="flex items-center gap-4">
          <span>
            共 {totalCount} 个文件
          </span>
          {searchTerm && filteredCount !== totalCount && (
            <span className="text-blue-600">
              筛选后显示 {filteredCount} 个文件
            </span>
          )}
        </div>
        
        {/* 当前筛选状态指示器 */}
        <div className="flex items-center gap-2">
          {searchTerm && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              搜索: {searchTerm}
            </span>
          )}
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            {sortBy === 'fileName' ? '文件名' : sortBy === 'uploadTime' ? '上传时间' : '文件大小'}
            {sortOrder === 'asc' ? ' ↑' : ' ↓'}
          </span>
        </div>
      </div>
    </div>
  );
}