export const brl = (v: number): string => `R$ ${v}`;

export const isValidEmail = (email: string): boolean => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

export type CatalogItem = {
  name: string;
  price: number;
  img: string | null;
};

export const getCatalogItems = (pt: boolean, womenImg: string, menImg: string): CatalogItem[] => {
  const names = pt
    ? ["Vestido Seda", "Casaco Linho", "Bolsa Couro", "Camisa Branca", "Saia Plissada", "Blazer Areia", "Calça Wide", "Top Canelado", "Lenço Estampa"]
    : ["Silk Dress", "Linen Coat", "Leather Bag", "White Shirt", "Pleated Skirt", "Sand Blazer", "Wide Pants", "Ribbed Top", "Print Scarf"];
  return names.map((name, i) => ({
    name,
    price: 289 + i * 40,
    img: i === 0 ? womenImg : i === 1 ? menImg : null,
  }));
};

export const paginate = <T>(items: T[], page: number, perPage: number): T[] => {
  return items.slice((page - 1) * perPage, page * perPage);
};

export const getTotalPages = (totalItems: number, perPage: number): number => {
  return Math.ceil(totalItems / perPage);
};

export type CartItem = {
  id: number;
  title: string;
  variant: string;
  price: number;
};

export const getSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};
