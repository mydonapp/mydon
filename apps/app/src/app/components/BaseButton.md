# BaseButton Component

A comprehensive, reusable button component for the myDon application.

## Features

- **Multiple Variants**: primary, secondary, success, danger, warning, info, ghost, link
- **Multiple Sizes**: xs, sm, md, lg, xl
- **Loading States**: Built-in spinner with customizable behavior
- **Navigation Support**: Works as button, router-link, or anchor tag
- **Full Customization**: Supports icons, custom classes, and all standard button behaviors
- **Consistent Styling**: Gradient backgrounds, shadows, focus states, and transitions

## Usage Examples

### Basic Buttons

```vue
<!-- Primary button (default) -->
<BaseButton>Click me</BaseButton>

<!-- Different variants -->
<BaseButton variant="success">Save</BaseButton>
<BaseButton variant="danger">Delete</BaseButton>
<BaseButton variant="ghost">Cancel</BaseButton>
<BaseButton variant="link">Learn more</BaseButton>
```

### Sizes

```vue
<BaseButton size="xs">Extra Small</BaseButton>
<BaseButton size="sm">Small</BaseButton>
<BaseButton size="md">Medium (default)</BaseButton>
<BaseButton size="lg">Large</BaseButton>
<BaseButton size="xl">Extra Large</BaseButton>
```

### With Icons

```vue
<BaseButton variant="success">
  <template #icon>
    <RiCheckLine class="w-5 h-5" />
  </template>
  Save Changes
</BaseButton>
```

### Loading States

```vue
<BaseButton :loading="isSubmitting" :disabled="isSubmitting">
  <template #icon>
    <RiSendLine class="w-5 h-5" />
  </template>
  Submit Form
</BaseButton>
```

### Navigation

```vue
<!-- Router Link -->
<BaseButton tag="router-link" :to="{ name: 'Dashboard' }" variant="primary">
  Go to Dashboard
</BaseButton>

<!-- External Link -->
<BaseButton tag="a" href="https://example.com" variant="ghost">
  External Link
</BaseButton>
```

### Form Buttons

```vue
<!-- Submit button -->
<BaseButton type="submit" variant="primary" size="lg" :loading="isLoading" :disabled="!isFormValid" block shadow>
  <template #icon>
    <RiLoginBoxLine class="w-5 h-5" />
  </template>
  Login
</BaseButton>
```

## Props

| Prop                 | Type                                                                                            | Default     | Description                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------- |
| `variant`            | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info' \| 'ghost' \| 'link'` | `'primary'` | Visual style variant                                |
| `size`               | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`                                                          | `'md'`      | Button size                                         |
| `type`               | `'button' \| 'submit' \| 'reset'`                                                               | `'button'`  | Button type (when tag is 'button')                  |
| `disabled`           | `boolean`                                                                                       | `false`     | Disable the button                                  |
| `loading`            | `boolean`                                                                                       | `false`     | Show loading spinner and disable                    |
| `hideLoadingSpinner` | `boolean`                                                                                       | `false`     | Hide the loading spinner but keep loading behavior  |
| `tag`                | `'button' \| 'router-link' \| 'a'`                                                              | `'button'`  | HTML tag or component to render                     |
| `to`                 | `string \| object`                                                                              | `undefined` | Router link destination (when tag is 'router-link') |
| `href`               | `string`                                                                                        | `undefined` | Link URL (when tag is 'a')                          |
| `block`              | `boolean`                                                                                       | `false`     | Make button full width                              |
| `rounded`            | `boolean`                                                                                       | `true`      | Apply rounded corners                               |
| `shadow`             | `boolean`                                                                                       | `false`     | Apply drop shadow                                   |
| `class`              | `string`                                                                                        | `undefined` | Additional CSS classes                              |

## Slots

| Slot      | Description                        |
| --------- | ---------------------------------- |
| `default` | Button content/text                |
| `icon`    | Icon content (hidden when loading) |

## Events

| Event   | Payload | Description                                                   |
| ------- | ------- | ------------------------------------------------------------- |
| `click` | `Event` | Emitted when button is clicked (not when disabled or loading) |

## Used In

- Login form submit button (`variant="primary"`, `size="lg"`, `shadow`)
- Signup form submit button (`variant="success"`, `size="lg"`, `shadow`)
- Navigation links (`variant="link"`, `size="sm"`)
- Other form actions throughout the app
