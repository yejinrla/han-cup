import type {Basis,DrinkVariant,Nutrition} from './types';
export function getNutrition(v:DrinkVariant,basis:Basis):Nutrition{if(basis==='serving')return v.nutrition;const ml=v.nutritionBasisMl;if(!ml||!Number.isFinite(ml)||ml<=0)return {caloriesKcal:null,sugarG:null,caffeineMg:null};return Object.fromEntries(Object.entries(v.nutrition).map(([key,n])=>[key,n===null?null:n*100/ml])) as Nutrition;}
export function fmt(value:number|null,unit=''){return value===null?'미제공':new Intl.NumberFormat('ko-KR',{maximumFractionDigits:1}).format(value)+unit;}
