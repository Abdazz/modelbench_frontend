import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Identite visuelle ModelBench : un accent "signal" teal fonce plutot que l emerald ou l
 * indigo par defaut d Aura, choisi pour sa lisibilite (contraste AA sur fond blanc et sur
 * fond sombre) et son evocation d instrument de mesure de laboratoire.
 */
export const ModelBenchPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#EAFBF8',
      100: '#CBF3EC',
      200: '#97E4DA',
      300: '#62CFC0',
      400: '#33B6A9',
      500: '#0E7E73',
      600: '#0A655C',
      700: '#084F48',
      800: '#073F3A',
      900: '#052E2A',
      950: '#031F1C',
    },
    colorScheme: {
      dark: {
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}',
        },
      },
    },
  },
});
