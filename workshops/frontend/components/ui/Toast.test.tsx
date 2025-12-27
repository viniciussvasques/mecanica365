import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Componente de teste para usar o hook
const TestComponent = () => {
    const { success, error, info, warning } = useToast();
    return (
        <div>
            <button onClick={() => success('Success message')}>Success</button>
            <button onClick={() => error('Error message')}>Error</button>
            <button onClick={() => info('Info message')}>Info</button>
            <button onClick={() => warning('Warning message')}>Warning</button>
        </div>
    );
};

describe('Toast Component', () => {
    it('should show success toast', async () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const user = userEvent.setup();
        await user.click(screen.getByText('Success'));

        expect(await screen.findByText('Success message')).toBeInTheDocument();
    });

    it('should show error toast', async () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const user = userEvent.setup();
        await user.click(screen.getByText('Error'));

        expect(await screen.findByText('Error message')).toBeInTheDocument();
    });
});
