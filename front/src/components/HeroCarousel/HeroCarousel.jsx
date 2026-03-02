import { useCallback, useMemo, useState } from 'react';
import './HeroCarousel.css';

export default function HeroCarousel() {
    const images = useMemo(() => [
        '/img/img_1.jpg',
        '/img/img_2.jpg',
        '/img/img_3.jpg',
        '/img/img_4.jpg',
        '/img/img_5.jpg',
        '/img/img_6.jpg',
        '/img/img_7.jpg',
        '/img/img_8.jpg',
        '/img/img_9.jpg',
        '/img/img_10.jpg',
        '/img/img_11.jpg',
    ], []);

    const [index, setIndex] = useState(0);

    const prev = useCallback(() => {
        if (images.length === 0) return;
        setIndex((i) => (i - 1 + images.length) % images.length);
    }, [images.length]);

    const next = useCallback(() => {
        if (images.length === 0) return;
        setIndex((i) => (i + 1) % images.length);
    }, [images.length]);

    return (
        <div className="hero-carousel" role="region" aria-label="Carrousel">
            {images.length > 0 ? (
                <img
                    className="hero-image"
                    src={images[index]}
                    alt={`Slide ${index + 1} / ${images.length}`}
                />
            ) : (
                <div className="hero-text">Aucune image</div>
            )}
            <button className="hero-arrow left" aria-label="Précédent" onClick={prev}>
                ←
            </button>
            <button className="hero-arrow right" aria-label="Suivant" onClick={next}>
                →
            </button>
        </div>
    );
}
