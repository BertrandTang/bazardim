import React from 'react';
import './Cart.css';
import { useCart } from '../../context/CartContext.jsx';

export default function Cart() {
  const { items, addItem, changeQuantity, removeItem, clear, total } = useCart();

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h2>Panier</h2>
        {items.length > 0 && (
          <button className="cart-clear" onClick={clear}>
            Vider le panier
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="cart-empty">Votre panier est vide.</div>
      ) : (
        <>
          <div className="cart-list">
            {items.map((item) => {
              const quantity = item.quantity || 1;
              const unitPrice = Number(item.price || 0);
              const lineTotal = unitPrice * quantity;
              const image =
                item.image || item.img || item.product_img || '/img/img_1.jpg';

              return (
                <div key={item.id} className="cart-item">
                  <div className="cart-left">
                    <div className="cart-thumb-wrap">
                      {quantity > 1 && (
                        <span className="cart-qty-badge">x{quantity}</span>
                      )}
                      <img src={image} alt={item.title || `Produit #${item.id}`} />
                    </div>
                    <div className="info">
                      <div className="title">
                        {item.title || `Produit #${item.id}`}
                      </div>
                      <div className="unit-price">
                        {unitPrice.toFixed(2)}€ / unité
                      </div>
                    </div>
                  </div>
                  <div className="cart-right">
                    <div className="cart-qty-controls">
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => changeQuantity(item.id, -1)}
                        disabled={quantity <= 1}
                      >
                        −
                      </button>
                      <span className="cart-qty-value">{quantity}</span>
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => addItem(item, 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="price">{lineTotal.toFixed(2)}€</div>
                    <div className="cart-actions">
                      <button
                        className="remove"
                        type="button"
                        onClick={() => removeItem(item.id)}
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cart-summary">
            <div className="cart-summary-label">Total commande</div>
            <div className="cart-summary-value">{total.toFixed(2)}€</div>
            <button
              type="button"
              className="cart-checkout-btn"
              onClick={() => alert('Fonctionnalité de commande à implémenter')}
            >
              Commander
            </button>
          </div>
        </>
      )}
    </div>
  );
}
