import * as mock from "./mock";
import * as supabase from "./supabase";

const source = process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? supabase : mock;

export const getCaseByToken = source.getCaseByToken;
export const createContactRequest = source.createContactRequest;
export const getDemoNow = source.getDemoNow;