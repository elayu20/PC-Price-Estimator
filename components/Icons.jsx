// Small line icons, all 20x20 with the same 1.75 stroke, sized by className

function Icon({ className = "size-4", children }) {
    return (
        <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {children}
        </svg>
    );
}

export function SearchIcon(props) {
    return <Icon {...props}><circle cx="8.5" cy="8.5" r="5" /><path d="m12.5 12.5 4 4" /></Icon>;
}

export function CloseIcon(props) {
    return <Icon {...props}><path d="m5.5 5.5 9 9M14.5 5.5l-9 9" /></Icon>;
}

export function ConflictIcon(props) {
    return <Icon {...props}><path d="M10 3 2.5 16.5h15Z" /><path d="M10 8.5v3.5M10 14.4v.1" /></Icon>;
}

export function ChevronIcon(props) {
    return <Icon {...props}><path d="m6 8 4 4 4-4" /></Icon>;
}
