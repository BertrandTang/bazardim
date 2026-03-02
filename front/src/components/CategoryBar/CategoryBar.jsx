import "./CategoryBar.css";

export default function CategoryBar({
    value,
    onChange,
    licence,
    onLicenceChange,
    character,
    onCharacterChange,
    categories = [],
    licences = [],
    characters = [],
}) {
    return (
        <div className="category-bar">
            <div className="category-tabs">
                {categories.map((category, index) => (
                    <button
                        key={category}
                        className={value === index ? "active" : ""}
                        onClick={() => onChange(index)}
                    >
                        {category}
                    </button>
                ))}
            </div>
            <div className="category-selects">
                <label>
                    Licence
                    <select
                        value={licence}
                        onChange={(event) => onLicenceChange(event.target.value)}
                    >
                        {licences.map((licence) => (
                            <option key={licence}>{licence}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Personnage
                    <select
                        value={character}
                        onChange={(event) => onCharacterChange(event.target.value)}
                    >
                        {characters.map((character) => (
                            <option key={character}>{character}</option>
                        ))}
                    </select>
                </label>
            </div>
        </div>
    );
}
