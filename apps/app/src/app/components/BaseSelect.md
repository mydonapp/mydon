# BaseSelect Component

A comprehensive, reusable select/dropdown component for the myDon application.

## Features

- **Multiple Options Support**: Pass options as array or use slot for custom content
- **Multiple Selection**: Support for single and multiple selection modes
- **Multiple Sizes**: xs, sm, md, lg
- **Multiple Variants**: default, bordered, ghost, primary
- **Icon Support**: Left icon slot for enhanced UX
- **Validation**: Built-in error and help text display
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Consistent Styling**: Matches the design system with proper focus states

## Usage Examples

### Basic Select

```vue
<BaseSelect
  v-model="selectedOption"
  :options="[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
  ]"
  label="Choose an option"
  placeholder="Select one..."
/>
```

### Select with Icon

```vue
<BaseSelect v-model="accountType" :options="accountTypeOptions" label="Account Type" required>
  <template #leftIcon>
    <RiAccountCircleLine class="w-5 h-5" />
  </template>
</BaseSelect>
```

### Multiple Selection

```vue
<BaseSelect v-model="selectedCategories" :options="categoryOptions" label="Categories" placeholder="Select categories..." multiple />
```

### Custom Options (Slot)

```vue
<BaseSelect v-model="selectedAccount" label="Account" placeholder="Choose account...">
  <template #options>
    <option 
      v-for="account in accounts" 
      :key="account.id" 
      :value="account.id"
    >
      {{ account.name }} ({{ account.currency }})
    </option>
  </template>
</BaseSelect>
```

### With Validation

```vue
<BaseSelect v-model="selection" :options="options" label="Required Field" placeholder="Please select..." required :error="validationError" help-text="This field is required for the form submission" />
```

## Props

| Prop          | Type                                              | Default     | Description               |
| ------------- | ------------------------------------------------- | ----------- | ------------------------- |
| `modelValue`  | `string \| number \| string[] \| number[]`        | `''`        | The selected value(s)     |
| `options`     | `SelectOption[]`                                  | `[]`        | Array of option objects   |
| `label`       | `string`                                          | `undefined` | Label text for the select |
| `placeholder` | `string`                                          | `undefined` | Placeholder text          |
| `disabled`    | `boolean`                                         | `false`     | Disable the select        |
| `required`    | `boolean`                                         | `false`     | Mark as required field    |
| `error`       | `string`                                          | `undefined` | Error message to display  |
| `helpText`    | `string`                                          | `undefined` | Help text to display      |
| `size`        | `'xs' \| 'sm' \| 'md' \| 'lg'`                    | `'md'`      | Size of the select        |
| `variant`     | `'default' \| 'bordered' \| 'ghost' \| 'primary'` | `'default'` | Visual style variant      |
| `multiple`    | `boolean`                                         | `false`     | Allow multiple selections |

## SelectOption Interface

```typescript
interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}
```

## Slots

| Slot       | Description                                       |
| ---------- | ------------------------------------------------- |
| `leftIcon` | Icon content on the left side                     |
| `options`  | Custom option elements (overrides `options` prop) |

## Events

| Event               | Payload                                    | Description                     |
| ------------------- | ------------------------------------------ | ------------------------------- |
| `update:modelValue` | `string \| number \| string[] \| number[]` | Emitted when selection changes  |
| `blur`              | `FocusEvent`                               | Emitted when select loses focus |
| `focus`             | `FocusEvent`                               | Emitted when select gains focus |

## Used In

- Account type selection in forms
- Account selection dropdowns
- Filter controls in transaction views
- Settings and preference selections
- Multi-category assignments
