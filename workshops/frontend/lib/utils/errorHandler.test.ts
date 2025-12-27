import { getErrorMessage } from './errorHandler';
import { describe, it, expect } from 'vitest';

describe('getErrorMessage', () => {
    it('should return message from Error object', () => {
        const error = new Error('Test error');
        expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should return string error directly', () => {
        expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should return default message for unknown error types', () => {
        expect(getErrorMessage({ random: 'object' })).toBe('Ocorreu um erro desconhecido. Tente novamente.');
    });

    it('should handle Axios-like error response', () => {
        const axiosError = {
            response: {
                data: {
                    message: 'API Error'
                }
            }
        };
        expect(getErrorMessage(axiosError)).toBe('API Error');
    });

    it('should handle Axios-like error array', () => {
        const axiosError = {
            response: {
                data: {
                    message: ['Error 1', 'Error 2']
                }
            }
        };
        expect(getErrorMessage(axiosError)).toBe('Error 1, Error 2');
    });
});
