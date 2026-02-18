# @aiready/components

[![npm](https://img.shields.io/npm/v/@aiready/components)](https://www.npmjs.com/package/@aiready/components) [![GitHub](https://img.shields.io/badge/GitHub-aiready--components-blue?logo=github)](https://github.com/caopengau/aiready-components)

Unified shared components library (UI, charts, hooks, utilities) for AIReady.

## Features

- 🎨 **UI Components**: Button, Card, Input, Label, Badge, Container, Grid, Stack, Separator (shadcn/ui based)
- 🗂️ **Form Components**: Select, Checkbox, RadioGroup, Switch, Textarea
- 📊 **D3 Charts**: ForceDirectedGraph with physics-based layout and interactive controls
- 🪝 **React Hooks**: `useDebounce`, `useD3`, `useForceSimulation`
- 🛠️ **Utilities**: `cn` (className merging), formatters, color schemes
- 🌙 **Dark Mode**: Built-in support via Tailwind CSS
- 🎯 **Tree-shakeable**: Granular exports for optimal bundle size
- 📦 **TypeScript**: Full type safety

## Installation

```bash
pnpm add @aiready/components
```

## Usage

### Import Everything

```tsx
import { Button, Card, Input, Label, Badge } from '@aiready/components';

function App() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
      </CardContent>
      <CardFooter>
        <Button>Submit</Button>
        <Badge variant="secondary">New</Badge>
      </CardFooter>
    </Card>
  );
}
```

### Import Specific Components (Tree-shaking)

```tsx
import { Button } from '@aiready/components/button';
import { Card } from '@aiready/components/card';
```

## Components

### Button

```tsx
import { Button } from '@aiready/components/button';

<Button variant="default">Click me</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="lg">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

**Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`  
**Sizes**: `default`, `sm`, `lg`, `icon`

### Card

```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent, 
  CardFooter 
} from '@aiready/components/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input

```tsx
import { Input } from '@aiready/components/input';

<Input type="text" placeholder="Enter text..." />
<Input type="email" placeholder="Email..." />
<Input type="password" placeholder="Password..." />
```

### Label

```tsx
import { Label } from '@aiready/components/label';

<Label htmlFor="username">Username</Label>
<Input id="username" />
```

### Badge

```tsx
import { Badge } from '@aiready/components/badge';

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

## Tailwind CSS Setup

This package requires Tailwind CSS. Add the package to your Tailwind config:

```js
// tailwind.config.js
export default {
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@aiready/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Use the shared config
    },
  },
  plugins: [],
};
```

### CSS Variables

Add these CSS variables to your global styles:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm typecheck

# Run tests
pnpm test
```

## Roadmap

### Phase 1: Foundation ✅ COMPLETE
- [x] Button, Card, Input, Label, Badge components
- [x] Tailwind configuration
- [x] TypeScript setup
- [x] Build system (tsup)

### Phase 2: Extended UI + Charts ✅ COMPLETE
- [x] Layout components (Container, Grid, Stack, Separator)
- [x] Form components (Select, Checkbox, RadioGroup, Switch, Textarea)
- [x] D3 Charts (ForceDirectedGraph with physics-based layout)

### Phase 3: Advanced Charts + Utilities ✅ COMPLETE
- [x] ForceDirectedGraph with interactive controls and dark/light mode
- [x] React hooks (`useD3`, `useDebounce`, `useForceSimulation`)
- [x] Utilities (`cn`, formatters, color schemes)

### Phase 4: Future (Planned)
- [ ] Additional D3 charts (LineChart, BarChart, HeatMap, TreeMap)
- [ ] Interactive components (Modal, Dropdown, Tabs, Tooltip)

## License

MIT

## Maintainer

Peng Cao (@caopengau)