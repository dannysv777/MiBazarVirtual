import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as walletApi from '../../api/walletApi';
import * as profileApi from '../../api/profileApi';
import AppBadge from '../../components/common/AppBadge';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import EmptyState from '../../components/common/EmptyState';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { getErrorMessage, getList, getPayload } from '../../utils/apiResponse';
import { formatPrice } from '../../utils/formatters';
import { scale } from '../../utils/responsive';

const brands = ['Visa', 'Mastercard', 'Otro'];
const accountTypes = [
  { key: 'MONETARIA', label: 'Monetaria' },
  { key: 'AHORRO', label: 'Ahorro' },
];

export default function WalletScreen({ navigation }) {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const isSeller = String(user?.role ?? '').trim().toUpperCase() === 'SELLER';
  const [cards, setCards] = useState([]);
  const [bankAccount, setBankAccount] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [cardForm, setCardForm] = useState({
    alias: '',
    lastFour: '',
    brand: 'Visa',
    expiryMonth: '',
    expiryYear: '',
  });
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    accountType: 'MONETARIA',
  });

  const loadWallet = useCallback(async () => {
    setLoading(true);

    try {
      if (isSeller) {
        const [accountResponse, statsResponse] = await Promise.allSettled([
          walletApi.getBankAccount(),
          profileApi.getSellerStats(),
        ]);
        const account = accountResponse.status === 'fulfilled' ? getPayload(accountResponse.value) : null;
        setBankAccount(account);
        setSellerStats(statsResponse.status === 'fulfilled' ? getPayload(statsResponse.value) : null);
        setEditingBank(!account);
        if (account) {
          setBankForm({
            bankName: account.bankName ?? '',
            accountNumber: account.accountNumber ?? '',
            accountHolder: account.accountHolder ?? '',
            accountType: account.accountType ?? 'MONETARIA',
          });
        }
      } else {
        const response = await walletApi.getCards();
        setCards(getList(response));
      }
    } catch (walletError) {
      showError(getErrorMessage(walletError, 'No pudimos cargar tu billetera.'));
    } finally {
      setLoading(false);
    }
  }, [isSeller, showError]);

  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, [loadWallet])
  );

  const defaultCard = useMemo(() => cards.find((card) => card.isDefault) ?? cards[0], [cards]);

  const resetCardForm = () => {
    setCardForm({
      alias: '',
      lastFour: '',
      brand: 'Visa',
      expiryMonth: '',
      expiryYear: '',
    });
  };

  const handleSaveCard = async () => {
    setSaving(true);

    try {
      await walletApi.addCard({
        alias: cardForm.alias.trim(),
        lastFour: cardForm.lastFour,
        brand: cardForm.brand,
        expiryMonth: Number(cardForm.expiryMonth),
        expiryYear: Number(cardForm.expiryYear),
      });
      showSuccess('Tarjeta guardada');
      setCardModalVisible(false);
      resetCardForm();
      await loadWallet();
    } catch (cardError) {
      showError(getErrorMessage(cardError, 'No pudimos guardar la tarjeta.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCardLongPress = (card) => {
    Alert.alert('Tarjeta guardada', `**** **** **** ${card.lastFour}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Marcar como principal',
        onPress: async () => {
          await walletApi.setDefaultCard(card.id);
          showSuccess('Tarjeta principal actualizada');
          await loadWallet();
        },
      },
      {
        text: 'Eliminar tarjeta',
        style: 'destructive',
        onPress: async () => {
          await walletApi.removeCard(card.id);
          showSuccess('Tarjeta eliminada');
          await loadWallet();
        },
      },
    ]);
  };

  const handleSaveBankAccount = async () => {
    setSaving(true);

    try {
      const response = await walletApi.saveBankAccount({
        bankName: bankForm.bankName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        accountHolder: bankForm.accountHolder.trim(),
        accountType: bankForm.accountType,
      });
      setBankAccount(getPayload(response));
      setEditingBank(false);
      showSuccess('Cuenta bancaria guardada');
    } catch (bankError) {
      showError(getErrorMessage(bankError, 'No pudimos guardar la cuenta bancaria.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>{isSeller ? 'Mi cuenta bancaria' : 'Mi billetera'}</Text>
            <Text style={styles.subtitle}>
              {isSeller ? 'Aqui recibiras tus pagos de MiBazarVirtual' : 'Metodos de pago preparados para proximas integraciones'}
            </Text>
          </View>
        </View>

        {isSeller ? (
          <SellerWallet
            bankAccount={bankAccount}
            bankForm={bankForm}
            editingBank={editingBank}
            saving={saving}
            setBankForm={setBankForm}
            setEditingBank={setEditingBank}
            sellerStats={sellerStats}
            onSave={handleSaveBankAccount}
          />
        ) : (
          <BuyerWallet
            cards={cards}
            defaultCard={defaultCard}
            onAddCard={() => setCardModalVisible(true)}
            onCardLongPress={handleCardLongPress}
          />
        )}
      </ScrollView>

      <AddCardModal
        visible={cardModalVisible}
        form={cardForm}
        saving={saving}
        setForm={setCardForm}
        onClose={() => setCardModalVisible(false)}
        onSave={handleSaveCard}
      />
    </SafeAreaView>
  );
}

function BuyerWallet({ cards, onAddCard, onCardLongPress }) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Metodos de pago</Text>
      </View>

      {cards.map((card) => (
        <TouchableOpacity
          key={card.id}
          activeOpacity={0.85}
          onLongPress={() => onCardLongPress(card)}
          style={styles.cardRow}
        >
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>{card.brand}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardNumber}>**** **** **** {card.lastFour}</Text>
            <Text style={styles.cardAlias}>{card.alias}</Text>
            <Text style={styles.cardExpiry}>Vence {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}</Text>
          </View>
          {card.isDefault ? <AppBadge label="Principal" variant="accent" /> : null}
        </TouchableOpacity>
      ))}

      <TouchableOpacity activeOpacity={0.85} onPress={onAddCard} style={styles.addCard}>
        <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        <Text style={styles.addCardText}>Agregar tarjeta</Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Ionicons name="card-outline" size={22} color="#3B82F6" />
        <Text style={styles.infoText}>
          Los pagos con tarjeta estaran disponibles proximamente. Por ahora todos los pedidos se pagan contra entrega.
        </Text>
      </View>
    </>
  );
}

function SellerWallet({ bankAccount, bankForm, editingBank, saving, setBankForm, setEditingBank, sellerStats, onSave }) {
  const revenue = Number(sellerStats?.totalRevenue ?? 0);
  const platformFee = revenue * 0.03;
  const estimatedPayout = Math.max(revenue - platformFee, 0);

  return (
    <>
      {!bankAccount && !editingBank ? (
        <View style={styles.emptyCard}>
          <EmptyState
            emoji="🏦"
            title="Sin cuenta bancaria"
            subtitle="Agrega tu cuenta para recibir tus ganancias"
            actionLabel="Agregar cuenta"
            onAction={() => setEditingBank(true)}
          />
        </View>
      ) : null}

      {bankAccount && !editingBank ? (
        <View style={styles.bankCard}>
          <View style={styles.bankHeader}>
            <View>
              <Text style={styles.bankName}>{bankAccount.bankName}</Text>
              <Text style={styles.bankNumber}>{bankAccount.maskedAccountNumber}</Text>
            </View>
            <AppBadge label={bankAccount.accountType} variant="primary" />
          </View>
          <Text style={styles.accountHolder}>{bankAccount.accountHolder}</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setEditingBank(true)} style={styles.editBankButton}>
            <Ionicons name="pencil-outline" size={18} color={colors.primary} />
            <Text style={styles.editBankText}>Editar cuenta</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {editingBank ? (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Datos bancarios</Text>
          <AppInput
            label="Nombre del banco"
            value={bankForm.bankName}
            onChangeText={(bankName) => setBankForm((current) => ({ ...current, bankName }))}
          />
          <AppInput
            label="Numero de cuenta"
            value={bankForm.accountNumber}
            keyboardType="number-pad"
            onChangeText={(accountNumber) => setBankForm((current) => ({ ...current, accountNumber }))}
          />
          <AppInput
            label="Nombre del titular"
            value={bankForm.accountHolder}
            autoCapitalize="words"
            onChangeText={(accountHolder) => setBankForm((current) => ({ ...current, accountHolder }))}
          />
          <View style={styles.typeRow}>
            {accountTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                activeOpacity={0.85}
                onPress={() => setBankForm((current) => ({ ...current, accountType: type.key }))}
                style={[styles.typeChip, bankForm.accountType === type.key && styles.typeChipActive]}
              >
                <Text style={[styles.typeText, bankForm.accountType === type.key && styles.typeTextActive]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <AppButton title="Guardar" onPress={onSave} loading={saving} fullWidth />
        </View>
      ) : null}

      <View style={styles.earningsCard}>
        <Text style={styles.earningsTitle}>Tus ganancias</Text>
        <View style={styles.reportGrid}>
          <ReportMetric label="Pedidos entregados" value={sellerStats?.deliveredOrders ?? 0} />
          <ReportMetric label="Ventas cobradas" value={formatPrice(revenue)} />
          <ReportMetric label="Comision 3%" value={formatPrice(platformFee)} />
          <ReportMetric label="Pago estimado" value={formatPrice(estimatedPayout)} highlight />
        </View>
        <Text style={styles.earningsBody}>Estos reportes son visuales para la demo. El deposito semanal se conectara al modulo de pagos.</Text>
      </View>
    </>
  );
}

function ReportMetric({ label, value, highlight = false }) {
  return (
    <View style={[styles.reportMetric, highlight && styles.reportMetricHighlight]}>
      <Text style={[styles.reportValue, highlight && styles.reportValueHighlight]}>{value}</Text>
      <Text style={[styles.reportLabel, highlight && styles.reportLabelHighlight]}>{label}</Text>
    </View>
  );
}

function AddCardModal({ visible, form, saving, setForm, onClose, onSave }) {
  const setDigits = (field, value, maxLength) => {
    setForm((current) => ({ ...current, [field]: value.replace(/\D/g, '').slice(0, maxLength) }));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Nueva tarjeta</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <AppInput
            label="Alias"
            placeholder="Mi Visa personal"
            value={form.alias}
            onChangeText={(alias) => setForm((current) => ({ ...current, alias }))}
          />
          <AppInput
            label="Ultimos 4 digitos"
            value={form.lastFour}
            keyboardType="number-pad"
            onChangeText={(lastFour) => setDigits('lastFour', lastFour, 4)}
          />
          <Text style={styles.brandLabel}>Marca</Text>
          <View style={styles.brandSelector}>
            {brands.map((brand) => (
              <TouchableOpacity
                key={brand}
                activeOpacity={0.85}
                onPress={() => setForm((current) => ({ ...current, brand }))}
                style={[styles.brandChip, form.brand === brand && styles.brandChipActive]}
              >
                <Text style={[styles.brandChipText, form.brand === brand && styles.brandChipTextActive]}>{brand}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.expiryRow}>
            <View style={styles.expiryField}>
              <AppInput
                label="Mes"
                value={form.expiryMonth}
                keyboardType="number-pad"
                onChangeText={(expiryMonth) => setDigits('expiryMonth', expiryMonth, 2)}
              />
            </View>
            <View style={styles.expiryField}>
              <AppInput
                label="Año"
                value={form.expiryYear}
                keyboardType="number-pad"
                onChangeText={(expiryYear) => setDigits('expiryYear', expiryYear, 4)}
              />
            </View>
          </View>
          <AppButton title="Guardar tarjeta" onPress={onSave} loading={saving} fullWidth />
          <Text style={styles.securityNote}>
            Solo guardamos los ultimos 4 digitos por tu seguridad. No almacenamos datos sensibles.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(20),
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: scale(14),
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  brandBadge: {
    minWidth: scale(52),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    height: scale(34),
    borderRadius: scale(10),
    backgroundColor: colors.secondary,
    marginRight: spacing.sm,
  },
  brandText: {
    ...typography.tiny,
    color: colors.surface,
    fontWeight: '900',
  },
  cardInfo: {
    flex: 1,
  },
  cardNumber: {
    ...typography.bodyBold,
  },
  cardAlias: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardExpiry: {
    ...typography.tiny,
    color: colors.textLight,
    marginTop: 2,
  },
  addCard: {
    minHeight: scale(76),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: scale(14),
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  addCardText: {
    ...typography.bodyBold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: scale(12),
    backgroundColor: '#EAF3FF',
  },
  infoText: {
    ...typography.small,
    flex: 1,
    color: colors.textPrimary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: scale(14),
    ...shadows.card,
  },
  bankCard: {
    padding: spacing.md,
    borderRadius: scale(14),
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  bankName: {
    ...typography.h3,
  },
  bankNumber: {
    ...typography.bodyBold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  accountHolder: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  editBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  editBankText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '800',
  },
  formCard: {
    padding: spacing.md,
    borderRadius: scale(14),
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: colors.background,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
  },
  typeText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  typeTextActive: {
    color: colors.surface,
  },
  earningsCard: {
    padding: spacing.md,
    borderRadius: scale(14),
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  earningsTitle: {
    ...typography.bodyBold,
  },
  earningsBody: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  reportMetric: {
    width: '47%',
    minHeight: scale(76),
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: scale(12),
    backgroundColor: colors.background,
  },
  reportMetricHighlight: {
    backgroundColor: colors.primary,
  },
  reportValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  reportValueHighlight: {
    color: colors.surface,
  },
  reportLabel: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reportLabelHighlight: {
    color: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    padding: spacing.md,
    borderTopLeftRadius: scale(22),
    borderTopRightRadius: scale(22),
    backgroundColor: colors.surface,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h3,
  },
  brandLabel: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  brandSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  brandChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: colors.background,
  },
  brandChipActive: {
    backgroundColor: colors.primary,
  },
  brandChipText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  brandChipTextActive: {
    color: colors.surface,
  },
  expiryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  expiryField: {
    flex: 1,
  },
  securityNote: {
    ...typography.tiny,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
