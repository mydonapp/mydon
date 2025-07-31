import { describe, it, expect, beforeEach } from 'vitest'; import { mount } from
'@vue/test-utils'; import ToastContainer from '../ToastContainer.vue'; import {
useToast } from '../composables/useToast'; describe('ToastContainer', () => {
beforeEach(() => { // Clear all toasts before each test const { clearAll } =
useToast(); clearAll(); }); it('should render empty when no toasts', () => {
const wrapper = mount(ToastContainer);
expect(wrapper.find('.toast').exists()).toBe(true);
expect(wrapper.findAll('.alert')).toHaveLength(0); }); it('should render toasts
when they exist', () => { const { showToast } = useToast(); showToast('Test
message 1', 'success'); showToast('Test message 2', 'error'); const wrapper =
mount(ToastContainer); const alerts = wrapper.findAll('.alert');
expect(alerts).toHaveLength(2); expect(alerts[0].text()).toContain('Test message
1'); expect(alerts[1].text()).toContain('Test message 2'); }); it('should apply
correct CSS classes for different toast types', () => { const { showToast } =
useToast(); showToast('Success message', 'success'); showToast('Error message',
'error'); showToast('Warning message', 'warning'); showToast('Info message',
'info'); const wrapper = mount(ToastContainer); const alerts =
wrapper.findAll('.alert');
expect(alerts[0].classes()).toContain('alert-success');
expect(alerts[1].classes()).toContain('alert-error');
expect(alerts[2].classes()).toContain('alert-warning');
expect(alerts[3].classes()).toContain('alert-info'); }); it('should render
correct icons for different toast types', () => { const { showToast } =
useToast(); showToast('Success message', 'success'); showToast('Error message',
'error'); showToast('Warning message', 'warning'); showToast('Info message',
'info'); const wrapper = mount(ToastContainer); const alerts =
wrapper.findAll('.alert'); // Check that each alert has an SVG icon
alerts.forEach(alert => { expect(alert.find('svg').exists()).toBe(true); }); });
it('should remove toast when clicked', async () => { const { showToast, toasts }
= useToast(); showToast('Clickable message', 'info');
expect(toasts.value).toHaveLength(1); const wrapper = mount(ToastContainer);
const alert = wrapper.find('.alert'); await alert.trigger('click');
expect(toasts.value).toHaveLength(0); }); it('should remove toast when close
button is clicked', async () => { const { showToast, toasts } = useToast();
showToast('Message with close button', 'info');
expect(toasts.value).toHaveLength(1); const wrapper = mount(ToastContainer);
const closeButton = wrapper.find('.btn-circle'); await
closeButton.trigger('click'); expect(toasts.value).toHaveLength(0); });
it('should prevent event propagation when close button is clicked', async () =>
{ const { showToast, toasts } = useToast(); showToast('Test message', 'info');
const wrapper = mount(ToastContainer); const alert = wrapper.find('.alert');
const closeButton = wrapper.find('.btn-circle'); // Mock the click event on the
alert let alertClicked = false; alert.element.addEventListener('click', () => {
alertClicked = true; }); await closeButton.trigger('click'); // The alert click
should not have been triggered due to event.stopPropagation()
expect(alertClicked).toBe(false); expect(toasts.value).toHaveLength(0); });
it('should handle getToastClass method correctly', () => { const wrapper =
mount(ToastContainer); const vm = wrapper.vm as any;
expect(vm.getToastClass('success')).toBe('alert-success');
expect(vm.getToastClass('error')).toBe('alert-error');
expect(vm.getToastClass('warning')).toBe('alert-warning');
expect(vm.getToastClass('info')).toBe('alert-info');
expect(vm.getToastClass('unknown')).toBe('alert-info'); // Default case });
it('should render toast messages correctly', () => { const { showToast } =
useToast(); const message = 'This is a test message with special characters &
symbols!'; showToast(message, 'info'); const wrapper = mount(ToastContainer);
const alert = wrapper.find('.alert'); expect(alert.text()).toContain(message);
}); it('should handle multiple toasts in correct order', () => { const {
showToast } = useToast(); showToast('First message', 'info'); showToast('Second
message', 'success'); showToast('Third message', 'error'); const wrapper =
mount(ToastContainer); const alerts = wrapper.findAll('.alert');
expect(alerts).toHaveLength(3); expect(alerts[0].text()).toContain('First
message'); expect(alerts[1].text()).toContain('Second message');
expect(alerts[2].text()).toContain('Third message'); }); });
