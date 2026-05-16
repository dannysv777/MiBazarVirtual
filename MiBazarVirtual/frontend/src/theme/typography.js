import { colors } from './colors';
import { fontScale } from '../utils/responsive';

export const typography = {
  h1: { fontSize: fontScale(28), fontWeight: '700', color: colors.textPrimary },
  h2: { fontSize: fontScale(22), fontWeight: '700', color: colors.textPrimary },
  h3: { fontSize: fontScale(18), fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: fontScale(15), fontWeight: '400', color: colors.textPrimary },
  bodyBold: { fontSize: fontScale(15), fontWeight: '600', color: colors.textPrimary },
  small: { fontSize: fontScale(13), fontWeight: '400', color: colors.textSecondary },
  tiny: { fontSize: fontScale(11), fontWeight: '500', color: colors.textSecondary },
  price: { fontSize: fontScale(18), fontWeight: '700', color: colors.primary },
};
