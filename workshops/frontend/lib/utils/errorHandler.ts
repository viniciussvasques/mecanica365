import axios from 'axios';

/**
 * Extrai uma mensagem de erro amigável de qualquer tipo de erro
 */
export const getErrorMessage = (error: unknown): string => {
    // Verificação robusta para erros do Axios ou similares (duck typing)
    if (axios.isAxiosError(error) || (error && typeof error === 'object' && 'response' in error && (error as any).response?.data)) {
        // Tenta pegar a mensagem retornada pelo backend (NestJS padrão)
        const responseData = (error as any).response?.data;

        if (typeof responseData === 'string') {
            return responseData;
        }

        if (responseData && typeof responseData === 'object') {
            // NestJS: { message: string | string[], error: string, statusCode: number }
            if ('message' in responseData) {
                const message = (responseData as any).message;
                if (Array.isArray(message)) {
                    return message.join(', '); // Retorna todas as mensagens separadas por vírgula
                }
                return message as string;
            }
        }

        return error instanceof Error ? error.message : 'Erro na requisição';
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'Ocorreu um erro desconhecido. Tente novamente.';
};
