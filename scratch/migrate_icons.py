import os
import re

MAPPING = {
    'Utensils': 'ForkKnife',
    'KeyRound': 'Key',
    'EyeOff': 'EyeSlash',
    'SunMoon': 'SunDim',
    'Library': 'Books',
    'LayoutDashboard': 'Layout',
    'WifiOff': 'WifiSlash',
    'ClipboardList': 'ClipboardText',
    'MoreVertical': 'DotsThreeVertical',
    'LogOut': 'SignOut',
    'SmartphoneNfc': 'DeviceMobile',
    'Smartphone': 'DeviceMobile',
    'Home': 'House',
    'Trash2': 'Trash',
    'Search': 'MagnifyingGlass',
    'RefreshCw': 'ArrowsCounterClockwise',
    'Filter': 'Funnel',
    'SlidersHorizontal': 'Sliders',
    'Edit3': 'Pencil',
    'ShieldAlert': 'ShieldWarning',
    'AlertTriangle': 'Warning',
    'DollarSign': 'CurrencyDollar',
    'CheckCircle2': 'CheckCircle',
    'AlertCircle': 'WarningCircle',
    'Grid3x3': 'GridNine',
    'SortAsc': 'SortAscending',
    'SortDesc': 'SortDescending',
    'CheckCheck': 'Checks',
    'Mail': 'Envelope',
    'MessageCircle': 'ChatCircle',
    'Mic': 'Microphone',
    'Send': 'PaperPlaneRight',
    'Smile': 'Smiley',
    'Sparkles': 'Sparkle',
    'Landmark': 'Bank',
    'ListFilter': 'Funnel',
    'CalendarDays': 'Calendar',
    'ChevronLeft': 'CaretLeft',
    'ChevronRight': 'CaretRight',
    'ChevronDown': 'CaretDown',
    'ChevronUp': 'CaretUp',
    'Sunrise': 'SunHorizon',
    'Award': 'Medal',
    'TrendingUp': 'TrendUp',
}

# Regex to match single-quoted strings, double-quoted strings, and backtick-quoted strings
string_regex = r'(?:"[^"\\]*(?:\\.[^"\\]*)*"|' \
               r"'[^'\\]*(?:\\.[^'\\]*)*'|" \
               r'`[^`\\]*(?:\\.[^`\\]*)*`)'

def replace_with_placeholders(content):
    placeholders = []
    def replace(match):
        placeholder = f"__STR_PLACEHOLDER_{len(placeholders)}__"
        placeholders.append(match.group(0))
        return placeholder
    
    temp_content = re.sub(string_regex, replace, content)
    return temp_content, placeholders

def restore_placeholders(content, placeholders):
    for i, orig in enumerate(placeholders):
        placeholder = f"__STR_PLACEHOLDER_{i}__"
        content = content.replace(placeholder, orig)
    return content

src_dir = 'packages/frontend/src'

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find import statement - using [^}]*? to prevent greediness across multiple imports
            import_regex = r'import\s+{([^}]*?)}\s+from\s+[\'\"]lucide-react[\'\"]\s*;?'
            matches = list(re.finditer(import_regex, content, re.DOTALL))
            if not matches:
                continue
                
            print(f"Migrating icons in {path}...")
            
            new_content = content
            for match in matches:
                import_statement = match.group(0)
                imported_icons_str = match.group(1)
                
                # Parse icons list
                icons = [i.strip() for i in imported_icons_str.split(',') if i.strip()]
                
                # Map icons and track replacements
                mapped_icons = []
                replacements = {}
                for icon in icons:
                    mapped = MAPPING.get(icon, icon)
                    mapped_icons.append(mapped)
                    if mapped != icon:
                        replacements[icon] = mapped
                
                # Build new import statement
                unique_mapped_icons = []
                for mi in mapped_icons:
                    if mi not in unique_mapped_icons:
                        unique_mapped_icons.append(mi)
                
                # For App.jsx, inject IconContext
                if file == 'App.jsx':
                    if 'IconContext' not in unique_mapped_icons:
                        unique_mapped_icons.append('IconContext')
                
                new_import = f"import {{ {', '.join(unique_mapped_icons)} }} from '@phosphor-icons/react';"
                
                # Replace the import statement
                new_content = new_content.replace(import_statement, new_import)
                
                # Protect string literals, replace code references using word boundaries, then restore
                temp_content, placeholders = replace_with_placeholders(new_content)
                for old_icon, new_icon in sorted(replacements.items(), key=lambda x: len(x[0]), reverse=True):
                    temp_content = re.sub(r'\b' + old_icon + r'\b', new_icon, temp_content)
                new_content = restore_placeholders(temp_content, placeholders)
            
            # For App.jsx, also wrap in IconContext.Provider
            if file == 'App.jsx':
                target_return = """  return (
    <div className="mobile-device-simulator">
      <div className="mobile-screen-viewport">
        {/* iPhone 17 Premium Dynamic Island Pill Camera */}
        <div className="iphone-dynamic-island" />
        {renderContent()}
      </div>
    </div>
  );"""
                replacement_return = """  return (
    <IconContext.Provider value={{ weight: 'light' }}>
      <div className="mobile-device-simulator">
        <div className="mobile-screen-viewport">
          {/* iPhone 17 Premium Dynamic Island Pill Camera */}
          <div className="iphone-dynamic-island" />
          {renderContent()}
        </div>
      </div>
    </IconContext.Provider>
  );"""
                if target_return in new_content:
                    new_content = new_content.replace(target_return, replacement_return)
                else:
                    # Fallback search if spacing slightly differs
                    print("Warning: could not find exact return statement in App.jsx to wrap in IconContext.Provider")
            
            # Save the file back
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)

print("Icon migration completed!")
