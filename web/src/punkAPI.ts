
export interface Quantity {
  value: number;
  unit: string;
}

export interface Beer {
  id: number;
  name: string;
  tagline: string;
  first_brewed: string;
  description: string;
  image_url: string;
  abv: number;
  ibu: number;
  target_fg: number;
  target_og: number;
  ebc: number;
  srm: number;
  ph: number;
  attenuation_level: number;
  volume: Quantity,
  boil_volume: Quantity
  method: {
    mash_temp: [
      {
        temp: Quantity;
        duration: number;
      }
    ];
    fermentation: {
      temp: Quantity;
    };
    twist: null;
  };
  ingredients: {
    malt: {
      name: string;
      amount: Quantity;
    }[];
    hops: {
      name: string;
      amount: Quantity;
      add: string;
      attribute: string;
    }[];
    yeast: string;
  };
  food_pairing: string[];
  brewers_tips: string;
  contributed_by: string;
}

export interface BeerFilters {
  abv_gt?: number;
  abv_lt?: number;
  ibu_gt?: number;
  ibu_lt?: number;
  ebc_gt?: number;
  ebc_lt?: number;
  beer_name?: string;
  yeast?: string;
  brewed_before?: Date;
  brewed_after?: Date;
  hops?: string;
  malt?: string;
  food?: string;
  ids?: string;
}

