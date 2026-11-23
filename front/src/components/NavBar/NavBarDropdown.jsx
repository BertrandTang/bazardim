import { useEffect, useId, useRef, useState } from 'react';

/**
 * Menu déroulant de la barre de navigation, utilisable :
 * - à la souris (survol ou clic) ;
 * - au doigt sur mobile (appui sur le bouton) ;
 * - au clavier (Entrée/Espace pour ouvrir, Échap pour fermer) ;
 * - avec un lecteur d'écran (aria-expanded annonce si le menu est ouvert).
 *
 * @param {object} props
 * @param {string} props.label - Texte du bouton (ex : "CATEGORIES").
 * @param {React.ReactNode} props.children - Les liens du menu.
 */
export default function NavBarDropdown({ label, children }) {
  const [isOpen, setIsOpen] = useState(false);
  // useRef garde une référence vers un élément HTML (ici le conteneur du menu),
  // sans provoquer de nouvel affichage quand elle change.
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  // Identifiant unique, pour relier le bouton au menu qu'il contrôle (aria-controls).
  const menuId = useId();

  // Tant que le menu est ouvert, un clic n'importe où ailleurs sur la page le ferme.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function closeIfClickOutside(event) {
      if (!containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('pointerdown', closeIfClickOutside);
    // La fonction retournée est appelée par React pour "nettoyer" : on retire l'écouteur.
    return () => document.removeEventListener('pointerdown', closeIfClickOutside);
  }, [isOpen]);

  function handleKeyDown(event) {
    if (event.key === 'Escape' && isOpen) {
      setIsOpen(false);
      // On replace le focus sur le bouton pour que l'utilisateur du clavier ne soit pas perdu.
      buttonRef.current.focus();
    }
  }

  // Le survol n'ouvre le menu qu'avec une souris (sur écran tactile, c'est l'appui qui compte).
  function handlePointerEnter(event) {
    if (event.pointerType === 'mouse') {
      setIsOpen(true);
    }
  }

  function handlePointerLeave(event) {
    if (event.pointerType === 'mouse') {
      setIsOpen(false);
    }
  }

  function handleButtonClick(event) {
    // À la souris, le survol a déjà ouvert le menu : le clic ne doit pas le refermer.
    // Au clavier (Entrée/Espace) ou au doigt, le bouton ouvre et ferme le menu.
    if (event.nativeEvent.pointerType === 'mouse') {
      setIsOpen(true);
    } else {
      setIsOpen((previousIsOpen) => !previousIsOpen);
    }
  }

  return (
    <div
      ref={containerRef}
      className="navbar-dropdown"
      onKeyDown={handleKeyDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <button
        ref={buttonRef}
        type="button"
        className="navbar-dropdown-button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={handleButtonClick}
      >
        {label}
      </button>
      {/* Un clic sur un lien du menu referme le menu. */}
      <div id={menuId} className="navbar-dropdown-menu" hidden={!isOpen} onClick={() => setIsOpen(false)}>
        {children}
      </div>
    </div>
  );
}
