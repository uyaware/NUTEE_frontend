import { LocalStorageRepository } from "../repositories/local/LocalStorageRepository";
import { createServices } from "./createServices";
// Composition root: replace this adapter and the demo auth adapter when the API is available.
export const localRepository = new LocalStorageRepository();
export const services = createServices(localRepository, localRepository);
