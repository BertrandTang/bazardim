import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import figuresData from '../../data/figures.json';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import { getAllProducts, subscribeToProductStorage } from '../../utils/productStorage.js';

const imagePool = [
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
];

export default function Home({ forcedCategory }) {
  const [searchParams] = useSearchParams();
  const [productsVersion, setProductsVersion] = useState(0);

  useEffect(() => {
    return subscribeToProductStorage(() => {
      setProductsVersion((prev) => prev + 1);
    });
  }, []);

  const products = useMemo(() => {
    const list = getAllProducts(figuresData.figures || []);
    return list.map((p, idx) => ({
      ...p,
      id: p.id ?? p.product_id,
      title: p.title || p.product_title,
      description: p.description || p.product_description,
      price: p.price ?? p.product_price,
      tags: p.tags || p.product_tags,
      username: p.owner_username || p.product_username,
      image: imagePool[idx % imagePool.length],
    }));
  }, [productsVersion]);

  const activeCategory = forcedCategory || 'TOUT';
  const activeLicence = searchParams.get('name') || '';
  const activeSearch = (searchParams.get('q') || '').trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = activeCategory === 'TOUT' || !activeCategory || p.category === activeCategory;
      const matchLicence = !activeLicence || p.licence_name === activeLicence;
      const matchSearch = !activeSearch || [
        p.title,
        p.description,
        p.category,
        p.licence_name,
        p.character_name,
        p.manufacturer,
        p.owner_username,
        ...(Array.isArray(p.tags) ? p.tags : []),
      ].join(' ').toLowerCase().includes(activeSearch);

      return matchCategory && matchLicence && matchSearch;
    });
  }, [products, activeCategory, activeLicence, activeSearch]);

  return (
    <Box sx={{ px: 4, py: 6, maxWidth: 1200, mx: 'auto' }}>
      <Grid container spacing={5} justifyContent="center">
        {filteredProducts.map((p) => (
          <Grid key={p.id}>
            <ProductCard product={p} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
