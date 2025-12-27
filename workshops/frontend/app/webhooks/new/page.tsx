import WebhookForm from '../_components/WebhookForm';

export default function NewWebhookPage() {
    return (
        <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 text-center">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Novo Webhook</h1>
                <WebhookForm />
            </div>
        </div>
    );
}
