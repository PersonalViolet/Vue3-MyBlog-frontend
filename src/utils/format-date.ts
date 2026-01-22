/** 格式化日期，将UTC时间转换为本地时区时间 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '未知时间';
  
  // 尝试解析日期字符串
  let date: Date;
  
  // 检查是否为UTC格式的时间字符串（包含'T'和'Z'）
  if (typeof dateString === 'string' && dateString.endsWith('Z')) {
    // 如果是UTC时间戳，直接使用
    date = new Date(dateString);
  } else if (typeof dateString === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z?/.test(dateString)) {
    // 如果是ISO 8601格式的时间字符串，确保是UTC时间
    if (!dateString.endsWith('Z')) {
      date = new Date(dateString + 'Z'); // 视为UTC时间
    } else {
      date = new Date(dateString);
    }
  } else {
    // 其他情况，尝试直接解析
    date = new Date(dateString);
  }
  
  if (isNaN(date.getTime())) {
    // 如果解析失败，直接返回原始字符串
    return dateString;
  }
  
  // 转换为本地时区时间
  const localYear = date.getFullYear();
  const localMonth = String(date.getMonth() + 1).padStart(2, '0');
  const localDay = String(date.getDate()).padStart(2, '0');
  const localHours = String(date.getHours()).padStart(2, '0');
  const localMinutes = String(date.getMinutes()).padStart(2, '0');
  const localSeconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${localYear}-${localMonth}-${localDay} ${localHours}:${localMinutes}:${localSeconds}`;
}