import { useState } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import './AddToCartButton.css';

/**
 * Bouton "AJOUTER" qui met le produit dans le panier et affiche brièvement "Ajouté au panier".
 */
export default function AddToCartButton({ productId }) {
  const { addToCart } = useCart();

  // Nombre de clics sur le bouton. On s'en sert comme `key` du message de confirmation :
  // quand la key change, React recrée l'élément, ce qui relance son animation CSS.
  const [clickCount, setClickCount] = useState(0);

  function handleClick() {
    addToCart(productId);
    setClickCount((previousCount) => previousCount + 1);
  }

  return (
    <div className="add-to-cart">
      {/* aria-live : les lecteurs d'écran annoncent le message quand il apparaît */}
      <div aria-live="polite">
        {clickCount > 0 && (
          <span key={clickCount} className="add-to-cart-confirmation">
            Ajouté au panier
          </span>
        )}
      </div>
      <button type="button" className="add-to-cart-button" onClick={handleClick}>
        AJOUTER
      </button>
    </div>
  );
}
