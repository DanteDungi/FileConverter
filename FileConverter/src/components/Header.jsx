export default function Header({ title }) {
    return (
        <header className="font-serif font-bold text-4xl mx-2 py-6">
            <h1 className="text-stone-50 text-shadow-lg/60">{title}</h1>
        </header>
    );
}
