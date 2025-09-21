# Room Code Implementation - 6 Character Format

## Overview
Implemented a new room code system where codes are generated as 6 alphanumeric characters but displayed with a hyphen between the 3rd and 4th characters for better readability.

## Key Features
- **Storage**: Room codes are stored as 6 characters (e.g., `ABCDEF`)
- **Display**: Room codes are shown with hyphen formatting (e.g., `ABC-DEF`)
- **Copy**: When copied, users get the raw 6-character code
- **Input**: Users can type codes with or without hyphens, system handles both

## Implementation Details

### Frontend Changes

#### 1. Custom RoomCodeInput Component
**File**: `frontend/src/components/ui/room-code-input.tsx`
- New component that handles automatic hyphen formatting
- Accepts raw 6-character input, displays with hyphen
- Handles paste operations (strips formatting)
- Validates input length and character types
- Provides consistent UX across the application

#### 2. Home Page Updates
**File**: `frontend/src/pages/Home.tsx`
- Updated room code generation to create 6-character codes (removed hyphen from generation)
- Replaced standard Input with RoomCodeInput component
- Updated validation logic to check for 6 characters instead of 7
- Added `formatCodeDisplay()` helper function for generated code display
- Updated copy function to copy raw 6-character code

#### 3. Room Lobby Component
**File**: `frontend/src/components/battle/RoomLobby.tsx`
- Added `formatCodeDisplay()` function
- Updated room code display to show formatted version
- Copy function provides raw 6-character code

#### 4. Spectate Page
**File**: `frontend/src/pages/Spectate.tsx`
- Added `formatCodeDisplay()` function
- Updated room code display in header

### Backend Compatibility
**File**: `backend/server.js`
- No changes required - backend already handles room codes as strings
- Works seamlessly with 6-character codes
- Room validation endpoint supports any string format

## User Experience

### Creating a Room
1. User clicks "Create Room"
2. System generates 6-character code (e.g., `ABCDEF`)
3. Code is displayed as `ABC-DEF` for readability
4. Copy button copies raw code `ABCDEF`

### Joining a Room
1. User can type `ABCDEF` or `ABC-DEF` in input field
2. System automatically formats display as `ABC-DEF`
3. Raw 6-character code is used for room lookup
4. Validation requires exactly 6 characters

### Code Sharing
- **Display**: Always shown as `ABC-DEF`
- **Copy**: Always copies `ABCDEF`
- **Paste**: Accepts both `ABCDEF` and `ABC-DEF`
- **URL**: Uses raw format `/battle/ABCDEF`

## Technical Benefits

1. **Consistency**: Uniform 6-character length for all codes
2. **Readability**: Hyphen makes codes easier to read and share verbally
3. **Usability**: Flexible input accepts both formats
4. **Compatibility**: Backend unchanged, maintains existing functionality
5. **Validation**: Clear 6-character requirement for validation

## Testing

### Manual Testing Checklist
- [ ] Generate room code displays with hyphen
- [ ] Copy button copies 6-character code without hyphen
- [ ] Input field accepts 6-character codes
- [ ] Input field accepts hyphenated codes and strips hyphen
- [ ] Paste functionality works with both formats
- [ ] Room creation works with 6-character codes
- [ ] Room joining works with 6-character codes
- [ ] Room lobby displays formatted code
- [ ] Spectate page displays formatted code

### Browser Console Testing
Run in browser console to test formatting functions:
```javascript
// Test the formatting logic
const formatDisplayValue = (rawValue) => {
  const cleanValue = rawValue.replace(/[^A-Z0-9]/g, '').toUpperCase();
  if (cleanValue.length <= 3) return cleanValue;
  return cleanValue.slice(0, 3) + '-' + cleanValue.slice(3, 6);
};

console.log(formatDisplayValue("ABCDEF")); // Should output: "ABC-DEF"
console.log(formatDisplayValue("ABC")); // Should output: "ABC"
``` 