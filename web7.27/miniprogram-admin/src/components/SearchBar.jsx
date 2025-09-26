import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchBar = ({ 
  searchTerm, 
  setSearchTerm, 
  onSearch, 
  placeholder = "搜索...",
  filterOptions = [],
  filterValue = '',
  onFilterChange = () => {},
  filterLabel = "全部类型",
  secondFilterOptions = [],
  secondFilterValue = '',
  onSecondFilterChange = () => {},
  secondFilterLabel = "全部分类",
  className = ""
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className={`bg-base-100 shadow rounded-lg p-4 mb-6 ${className}`}>
      <form className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center" onSubmit={(e) => e.preventDefault()}>
        {/* 搜索输入，右侧放大镜按钮 */}
        <div className="relative flex-[0.7] min-w-0">
          <input
            type="text"
            placeholder={placeholder}
            className="input input-bordered w-full pr-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 btn btn-ghost btn-square"
            onClick={onSearch}
            aria-label="搜索"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 类型筛选 */}
        {filterOptions.length > 0 && (
          <div className="form-control flex-shrink-0">
            <select
              className="select select-bordered w-full sm:w-auto min-w-32"
              value={filterValue}
              onChange={onFilterChange}
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 第二个筛选器 */}
        {secondFilterOptions.length > 0 && (
          <div className="form-control flex-shrink-0">
            <select
              className="select select-bordered w-full sm:w-auto min-w-32"
              value={secondFilterValue}
              onChange={onSecondFilterChange}
            >
              {secondFilterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
