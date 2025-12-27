import AutomationForm from '../_components/AutomationForm';

export default function NewAutomationPage() {
    return (
        <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 text-center">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Criar Nova Automação</h1>
                <AutomationForm />
            </div>
        </div>
    );
}
