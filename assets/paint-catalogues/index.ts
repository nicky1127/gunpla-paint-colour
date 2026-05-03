import mrHobby from './mr-hobby.json';
import tamiya from './tamiya.json';

export type CataloguePaint = {
  code: string;
  name: string;
  hex: string | null;
};

export type BrandCatalogue = {
  brand: string;
  paints: CataloguePaint[];
};

export const CATALOGUES: BrandCatalogue[] = [
  { brand: 'Mr. Hobby', paints: mrHobby as CataloguePaint[] },
  { brand: 'Tamiya', paints: tamiya as CataloguePaint[] },
];

export const CATALOGUE_BRANDS = CATALOGUES.map((c) => c.brand);
