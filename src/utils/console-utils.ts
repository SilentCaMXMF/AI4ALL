/**
 * Shared console formatting utilities for AI4ALL project
 * Eliminates duplicate console formatting patterns across files
 */

export interface ConsoleBoxOptions {
  width?: number;
  style?: 'single' | 'double' | 'header';
  padding?: number;
}

export interface SummaryItem {
  platform: string;
  count: number;
  status?: 'success' | 'error' | 'warning';
  error?: string;
}

export interface ProgressData {
  current: number;
  total: number;
  label?: string;
}

/**
 * Creates a formatted header box with title and version
 */
export function createHeader(title: string, version?: string): void {
  const width = 62;
  const versionText = version ? ` v${version}` : '';
  const fullTitle = title + versionText;
  
  // Center the title
  const padding = Math.max(0, width - fullTitle.length - 2);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  
  console.log('╔' + '═'.repeat(width) + '╗');
  console.log('║' + ' '.repeat(leftPad) + fullTitle + ' '.repeat(rightPad) + '║');
  console.log('╚' + '═'.repeat(width) + '╝');
  console.log();
}

/**
 * Creates a formatted summary box with platform statistics
 */
export function createSummary(items: SummaryItem[], totalLabel: string = 'Total'): void {
  const width = 62;
  
  console.log();
  console.log('╔' + '═'.repeat(width) + '╗');
  console.log('║' + ' '.repeat(21) + 'SCRAPE SUMMARY' + ' '.repeat(21) + '║');
  console.log('╠' + '═'.repeat(width) + '╣');
  
  let totalCount = 0;
  for (const item of items) {
    const status = item.status === 'success' ? '✅' : 
                   item.status === 'error' ? '❌' : '⚠️';
    const platform = item.platform.padEnd(15);
    const count = item.count.toString().padStart(3);
    const spacing = ' '.repeat(Math.max(0, 31 - platform.length - count.length));
    
    console.log(`║ ${status} ${platform}${spacing}${count} items${' '.repeat(15 - count.length)}║`);
    totalCount += item.count;
    
    if (item.error) {
      const errorText = item.error.slice(0, 35).padEnd(35);
      console.log(`║    Error: ${errorText} ║`);
    }
  }
  
  console.log('╠' + '═'.repeat(width) + '╣');
  const totalText = `${totalLabel}: ${totalCount.toString().padStart(3)} items`;
  const totalSpacing = ' '.repeat(width - totalText.length - 1);
  console.log(`║ ${totalText}${totalSpacing}║`);
  console.log('╚' + '═'.repeat(width) + '╝');
  console.log();
}

/**
 * Creates a progress bar or status indicator
 */
export function createProgressBar(progress: ProgressData): void {
  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const barLength = 30;
  const filledLength = Math.round((percentage / 100) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  const label = progress.label || 'Progress';
  console.log(`[${label}] ${bar} ${progress.current}/${progress.total} (${percentage.toFixed(1)}%)`);
}

/**
 * Creates a bordered box for content display
 */
export function createBox(content: string, options: ConsoleBoxOptions = {}): void {
  const width = options.width || 70;
  const style = options.style || 'single';
  const padding = options.padding || 1;
  
  const lines = content.split('\n');
  const horizontal = style === 'double' ? '═' : '─';
  const vertical = style === 'double' ? '║' : '│';
  const cornerTL = style === 'double' ? '╔' : style === 'header' ? '╔' : '┌';
  const cornerTR = style === 'double' ? '╗' : style === 'header' ? '╗' : '┐';
  const cornerBL = style === 'double' ? '╚' : style === 'header' ? '╚' : '└';
  const cornerBR = style === 'double' ? '╝' : style === 'header' ? '╝' : '┘';
  
  // Top border
  console.log(cornerTL + horizontal.repeat(width) + cornerTR);
  
  // Content with padding
  for (let i = 0; i < padding; i++) {
    console.log(vertical + ' '.repeat(width) + vertical);
  }
  
  for (const line of lines) {
    const remainingWidth = width - 2;
    const truncatedLine = line.length > remainingWidth ? 
                          line.slice(0, remainingWidth - 3) + '...' : 
                          line;
    const paddingNeeded = remainingWidth - truncatedLine.length;
    console.log(vertical + truncatedLine + ' '.repeat(paddingNeeded) + vertical);
  }
  
  for (let i = 0; i < padding; i++) {
    console.log(vertical + ' '.repeat(width) + vertical);
  }
  
  // Bottom border
  console.log(cornerBL + horizontal.repeat(width) + cornerBR);
}

/**
 * Creates a section header with divider
 */
export function createSectionHeader(title: string, width: number = 70): void {
  const icon = getIconForTitle(title);
  console.log(`${icon} ${title.toUpperCase()}`);
  console.log('═'.repeat(width));
}

/**
 * Creates a timestamped log entry
 */
export function createTimestampedLog(prefix: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  const timestamp = new Date().toLocaleTimeString();
  const icon = type === 'success' ? '✅' : 
              type === 'warning' ? '⚠️' : 
              type === 'error' ? '❌' : 'ℹ️';
  
  console.log(`[${prefix}] ${icon} ${message} (${timestamp})`);
}

/**
 * Helper function to get appropriate icon for section title
 */
function getIconForTitle(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('time') || lowerTitle.includes('schedule')) return '⏰';
  if (lowerTitle.includes('rate') || lowerTitle.includes('distribution')) return '📈';
  if (lowerTitle.includes('search') || lowerTitle.includes('strategy')) return '🎯';
  if (lowerTitle.includes('fresh') || lowerTitle.includes('content')) return '🔍';
  if (lowerTitle.includes('benefit') || lowerTitle.includes('optimization')) return '💡';
  if (lowerTitle.includes('state') || lowerTitle.includes('tracking')) return '📁';
  if (lowerTitle.includes('usage')) return '🚀';
  if (lowerTitle.includes('credential') || lowerTitle.includes('auth')) return '🔐';
  return '📊';
}

/**
 * Standard box drawing constants for consistency
 */
export const BOX_CHARS = {
  SINGLE: {
    TOP_LEFT: '┌',
    TOP_RIGHT: '┐',
    BOTTOM_LEFT: '└',
    BOTTOM_RIGHT: '┘',
    HORIZONTAL: '─',
    VERTICAL: '│',
    CROSS: '┼'
  },
  DOUBLE: {
    TOP_LEFT: '╔',
    TOP_RIGHT: '╗',
    BOTTOM_LEFT: '╚',
    BOTTOM_RIGHT: '╝',
    HORIZONTAL: '═',
    VERTICAL: '║',
    CROSS: '╬'
  },
  HEADER: {
    TOP_LEFT: '╔',
    TOP_RIGHT: '╗',
    BOTTOM_LEFT: '╚',
    BOTTOM_RIGHT: '╝',
    HORIZONTAL: '═',
    VERTICAL: '║',
    CROSS: '╬'
  }
} as const;