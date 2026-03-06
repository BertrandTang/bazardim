import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import figuresData from '../../data/figures.json';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';

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
  const [categoryIndex, setCategoryIndex] = useState(0);

  const products = useMemo(() => {
    const list = figuresData.figures || [];
    return list.map((p, idx) => ({
      ...p,
      id: p.id,
      title: p.title || p.product_title,
      description: p.description || p.product_description,
      price: p.price ?? p.product_price,
      tags: p.tags || p.product_tags,
      username: p.owner_username || p.product_username,
      image: imagePool[idx % imagePool.length],
    }));
  }, []);

  const categories = useMemo(
    () => ['TOUT', ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const selectedCategory = categories[categoryIndex] || categories[0] || '';
  const activeCategory = forcedCategory || selectedCategory;
  const activeLicence = searchParams.get('name') || '';
  const activeSearch = (searchParams.get('q') || '').trim().toLowerCase();

  const licenceOptions = useMemo(() => {
    const list = products.filter((p) => activeCategory === 'TOUT' || p.category === activeCategory);
    return Array.from(new Set(list.map((p) => p.licence_name))).filter(Boolean);
  }, [products, activeCategory]);

  const [licence, setLicence] = useState(() => licenceOptions[0] || '');

  useEffect(() => {
    if (!licenceOptions.includes(licence)) {
      setLicence(licenceOptions[0] || '');
    }
  }, [selectedCategory, licenceOptions.join('|')]);

  const characterOptions = useMemo(() => {
    const list = products.filter(
      (p) => (activeCategory === 'TOUT' || p.category === activeCategory) && (!licence || p.licence_name === licence)
    );
    return Array.from(new Set(list.map((p) => p.character_name))).filter(Boolean);
  }, [products, activeCategory, licence]);

  const [character, setCharacter] = useState(() => characterOptions[0] || '');

  useEffect(() => {
    if (!characterOptions.includes(character)) {
      setCharacter(characterOptions[0] || '');
    }
  }, [selectedCategory, licence, characterOptions.join('|')]);

  return (
    <Box sx={{ px: 4, py: 6, maxWidth: 1200, mx: 'auto' }}>
      <Grid container spacing={5} justifyContent="center">
        {products
          .filter(
            (p) => (activeCategory === 'TOUT' || !activeCategory || p.category === activeCategory)
              && (!activeLicence || p.licence_name === activeLicence)
              && (!activeSearch || [
                p.title,
                p.description,
                p.category,
                p.licence_name,
                p.character_name,
                p.manufacturer,
                p.owner_username,
                ...(Array.isArray(p.tags) ? p.tags : []),
              ].join(' ').toLowerCase().includes(activeSearch))
          )
          .map((p) => (
            <Grid key={p.id}>
              <ProductCard product={p} />
            </Grid>
          ))}
      </Grid>
    </Box>
  );
}
