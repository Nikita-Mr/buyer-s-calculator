<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { notifyListUpdated } from '@/utils/notifications';
// Состояние
const showStoreModal = ref(true);
const stores = ref([]);
const newStoreName = ref('');
const newStoreIcon = ref('');
const newStoreColor = ref('#9E9E9E');
const showAddStore = ref(false);
const activeTab = ref('products');
const editingStore = ref(null);
const tempProductsText = ref('');
const showHistoryModal = ref(false);
const selectedHistoryItem = ref(null);
const purchaseCost = ref('');
const showCostModal = ref(false);
const pendingStoreForCost = ref('');
const productsText = ref({});
const productsList = ref({});
const shoppingHistory = ref([]);
const productsData = ref({});

import { db } from '@/firebase'; // Убедитесь, что firebase.js настроен
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import InviteRoom from '@/components/InviteRoom.vue';

const roomId = localStorage.getItem('roomId');
const roomCode = localStorage.getItem('roomCode');
let unsubscribe = null;

import { useModalBack, useTabBack } from '@/composables/useBackButton';

const closeStoreModal = () => {
  showStoreModal.value = false;
};
const closeEditModal = () => {
  editingStore.value = null;
};
const closeHistoryModal = () => {
  showHistoryModal.value = false;
};
const closeCostModal = () => {
  showCostModal.value = false;
  purchaseCost.value = '';
  pendingStoreForCost.value = '';
};
const closeAddStore = () => {
  showAddStore.value = false;
  newStoreName.value = '';
};

// Регистрация вкладки для навигации назад
const switchTab = (tabName) => {
  activeTab.value = tabName;
};

useTabBack('products-tab', activeTab, switchTab);
// Регистрация модалок (одна строка на каждую)
useModalBack('store-modal', showStoreModal, closeStoreModal);
useModalBack('edit-modal', editingStore, closeEditModal);
useModalBack('history-modal', showHistoryModal, closeHistoryModal);
useModalBack('cost-modal', showCostModal, closeCostModal);
useModalBack('add-store-modal', showAddStore, closeAddStore);

// SVG логотипы магазинов
const storeLogos = {
  Пятёрочка: `<svg viewBox="0 0 44 44" width="32" height="32"><path fill-rule="evenodd" clip-rule="evenodd" d="M34.6623 4.00049C32.7469 8.91318 28.3864 9.93537 22.0699 9.93537C21.392 9.93537 20.7205 9.92471 20.0724 9.91512C19.4457 9.90659 18.853 9.897 18.2721 9.897C17.7562 9.897 17.2361 9.9034 16.7234 9.92578C17.6081 7.75349 19.0204 6.27723 21.0307 5.38188C23.8329 4.13479 27.4761 4.122 30.6908 4.11241C32.0914 4.10708 33.4323 4.10175 34.6623 4.00049Z" fill="#008F32"/><path fill-rule="evenodd" clip-rule="evenodd" d="M36.6326 5.57568C33.7994 11.7472 27.4851 12.3654 22.0725 12.3654C20.884 12.3654 19.7456 12.3366 18.6915 12.3302L17.3282 17.6618C24.3098 11.97 33.5425 17.6128 32.5555 26.2017C31.8904 31.9863 27.7665 35.7692 23.4038 36.8564C18.651 38.0417 13.3855 36.268 11.0245 31.4246C10.774 30.913 10.3381 29.8876 10.1718 29.3397L15.1836 28.0521C15.2721 28.341 15.4224 28.6203 15.5801 28.875C18.9356 34.2865 25.7349 31.5802 26.5023 25.9662C27.2836 20.2551 19.2703 17.2131 15.6185 23.8877L11.1737 21.9936L11.097 21.9595L13.2405 13.3546C13.3727 12.7427 13.8182 11.0341 13.895 10.7538C16.3177 1.84506 24.1552 1.70436 30.4419 1.68091C27.8421 0.599031 24.992 0 22 0C9.84884 0 0 9.84884 0 22C0 34.1512 9.84884 44 22 44C34.1512 44 44 34.1512 44 22C44 15.4682 41.1519 9.60475 36.6326 5.57568Z" fill="#EB2316"/></svg>`,
  Магнит: `<svg width="135" height="32" viewBox="0 0 135 32" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-b9a224dc=""><path fill-rule="evenodd" clip-rule="evenodd" d="M2.42273 10.4852C2.42273 8.30068 3.28608 6.24348 4.85617 4.69158C6.42489 3.1403 8.50461 2.28577 10.7114 2.28577H29.8513V6.45249H10.7114C9.62964 6.45249 8.60764 6.87358 7.83358 7.6376C7.06089 8.40354 6.63369 9.41524 6.63369 10.4852L6.60965 17.4791C6.41459 19.3367 4.99903 20.8349 3.16794 21.1113L2.42273 21.2244V10.4852Z" fill="#E6000E"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2.42273 29.7144V25.5473H21.5626C22.6444 25.5473 23.6664 25.1263 24.4377 24.3604C25.2138 23.5972 25.639 22.5864 25.639 21.5147L25.6424 14.877C25.6424 12.9002 27.1315 11.1859 29.1068 10.8877L29.8513 10.7758V21.5147C29.8513 23.6993 28.988 25.7558 27.4172 27.3076C25.8491 28.86 23.7715 29.7144 21.5626 29.7144H2.42273Z" fill="#E6000E"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M18.6637 21.2246V15.9152L16.1361 18.8205L13.6079 15.9152V21.2246H10.2589V10.7758H13.4314L16.1361 14.1351L18.8402 10.7758H22.014V21.2246H18.6637Z" fill="#E6000E"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M67.609 18.2251H64.0033L65.8064 13.5192L67.609 18.2251ZM68.822 21.3961L69.6263 23.4989H73.5922L67.6283 8.5H64.0423L58.0771 23.4989H61.9817L62.7878 21.3961H68.822ZM51.7557 23.4997V14.5856L47.8842 19.294L44.0144 14.5856V23.4997H40.137V8.50072H43.9613L47.8842 13.6581L51.8083 8.50072H55.6326V23.4997H51.7557ZM76.0584 8.50103V23.4999H79.9371V11.9843H85.3594V8.50103H76.0584ZM97.7352 17.6239V23.4999H101.613V8.50103H97.7352V14.0986H91.9754V8.50103H88.098V23.4999H91.9754V17.6239H97.7352ZM125.994 23.4999V11.9843H121.463V8.50103H134.423V11.9843H129.872V23.4999H125.994ZM114.858 14.9517V23.4999H118.738V8.50103H115.389L109.322 16.9592V8.50103H105.442V23.4999H108.686L114.858 14.9517Z" fill="#E6000E"></path></svg>`,
  Евроспар: `<svg xmlns="http://www.w3.org/2000/svg" width="161" height="26" fill="none" viewBox="0 0 161 26"><script xmlns=""/>
    <path fill="#008348" fill-rule="evenodd" d="M155.507 20.047c-1.282 1.12-2.665 2.298-4.446 1.93a2.542 2.542 0 0 1-1.914-1.875c-.209-.824-.157-1.614-.052-2.465l7.229-.014-.196-.254c-3.648-4.425-6.544-9.42-8.48-14.682-2.082 5.329-5.003 10.593-8.481 14.964l7.085-.014c-.042.974.179 2.164-.258 3-.441.918-1.475 1.373-2.431 1.393-2.857-.274-4.757-2.859-5.844-5.304-1.265-3.006-.799-7.131 1.189-9.699 2.767-3.78 7.652-5.306 12.205-3.858 2.775.896 5.245 3.119 6.463 5.948 1.444 3.505.591 8.192-2.069 10.93zm4.086-12.966c-1.064-1.919-2.629-3.726-4.396-4.877-3.97-2.706-9.864-2.92-14.013-.642-4.252 2.248-7.186 6.949-6.878 12.055.261 5.473 4.138 10.241 9.153 11.735 5.324 1.735 11.346-.114 14.789-4.34 2.968-3.728 3.719-9.595 1.345-13.931z" clip-rule="evenodd"/>
    <path fill="#EC1D24" fill-rule="evenodd" d="M125.336 18.057c.205.285.271.851.08 1.341-.177.454-.413.722-.872.913-.626.262-1.452.019-1.718-.3 0 0-2.146-2.535-3.332-3.977-.21-.213-.317-.408-.538-.625l-5.719.027c-1.419.006-3.093-1.64-3.093-2.951v-.506l10.65-.013c.398 0 .845-.362 1.063-.835.197-.426.194-.771 0-1.2-.231-.51-.757-.875-1.17-.873l-11.583.031-.034.113v10.02c0 .668-.949 1.526-1.878 1.441-.858-.08-1.562-.927-1.561-1.519l.013-10.62c.001-1.106.333-1.537 1.053-2.146.701-.593 1.335-.724 2.265-.723l12.573.013c1.795.002 3.475 1.322 4.148 3.225.723 2.04.056 3.846-1.569 5.316-.362.327-1.021.73-1.021.73l2.243 3.118zm-25.615 2.098c-.54.49-1.427.594-2.041.313-.97-.84-1.64-1.883-2.419-2.817l-13.056-.027-1.542 2.032c-.488.64-1.106 1.08-2.058.917-.494-.099-.964-.502-1.128-.94-.253-.566-.226-1.1.107-1.616L85.86 7.376c.694-1.007 1.444-1.728 2.74-1.721 2.037.026 2.177.524 3.582 2.277 1.958 2.643 5.912 7.602 7.915 10.397.253.634-.042 1.311-.375 1.826zm-29.014-4.799h-8.489c-1.242-.147-2.195-1.021-2.686-2.033-.168-.396-.177-.952-.224-1.365l.439.008h10.261c.443 0 .866-.393 1.075-.887.192-.452.18-.818-.053-1.25-.258-.481-.724-.784-1.182-.784H58.403l-.107.105v9.836c0 .915-.823 1.59-1.794 1.572-.851-.015-1.645-.686-1.645-1.554V8.47c0-.87.342-1.383.979-1.97.668-.614 1.547-.847 2.191-.846l12.627.013c2.433.002 4.406 2.43 4.34 4.972-.064 2.452-2.267 4.716-4.287 4.716zm-23.694 3.651c-1.303 1.56-3.086 1.58-5.05 1.578l-11.445-.012c-1.241-.002-2.287-1.189-2.463-2.409l-.008-.617 15.108.015c.506 0 1.154-.678 1.171-1.371.02-.749-.513-1.46-1.286-1.46H32.157c-1.882 0-3.801-1.716-4.11-3.86-.25-1.734.337-3.047 1.723-4.167 1.047-.845 1.843-1.087 3.308-1.089l10.066-.012c1.555-.029 3.248.232 3.977 1.668.221.439.337.916.322 1.5l-14.219.005c-.434 0-1.113.24-1.362.79-.311.686.047 1.471.751 1.774.281.121.779.104.779.104h10.344c1.85.127 3.5 1.282 4.136 3.182.555 1.654.27 3.03-.86 4.381zM0 0v26h129l.027-26H0z" clip-rule="evenodd"/>
    <path fill="#EC1D24" fill-rule="evenodd" d="M89.31 9.654c-.106-.008-.217.142-.217.142l-4.11 4.453h8.262c-1.17-1.534-2.52-2.958-3.748-4.435 0 0-.084-.152-.186-.16z" clip-rule="evenodd"/>
<script xmlns=""/></svg>`,
  Ашан: `<svg width="32" height="32" viewBox="0 0 130 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M31.977 10.423a.836.836 0 0 0 0 1.147.836.836 0 0 0 1.147 0 .836.836 0 0 0 0-1.147.836.836 0 0 0-1.147 0Z" fill="#fff"/><path fill-rule="evenodd" clip-rule="evenodd" d="M40.039 9.917h-3.474l-.844 1.046c-.135.135-.1.303.034.337l1.147.506 3.238-1.484c.203-.101.135-.405-.101-.405Zm-12.953 17h-4.284c-1.113.641-1.45.844-3.002 1.451-.101.034-.135.135-.101.304l3.845 10.726h2.193l-3.542-9.85c2.294 0 7.758-.607 10.693-5.396-.877 1.416-3.002 2.765-5.802 2.765Zm6.038-15.347a.836.836 0 0 1-1.147 0 .836.836 0 0 1 0-1.147.836.836 0 0 1 1.147 0 1.75 1.75 0 0 0-2.462 0 1.75 1.75 0 0 0 0 2.462 1.75 1.75 0 0 0 2.462 0 1.75 1.75 0 0 0 0-2.462c.304.337.304.843 0 1.147Zm-8.399 19.429c.742-.101 1.45-.236 2.058-.405l3.137 8.77h-2.193L24.725 31Zm2.968-10.423c-2.766 4.183-6.982 7.151-13.83 7.151H4.386c-.236 0-.236-.236-.135-.337l2.496-2.53c-3.474 0-5.498-2.058-6.24-4.351-.068-.135-.135-.405.135-.405h10.625c1.113 0 1.89-.337 2.53-.91l8.467-7.05c-3.171 2.732-7.489 6.948-11.402 12.345-.1.135.034.337.17.337h5.025c3.306 0 7.59-.607 12.008-5.296.102-.1.169-.1.27-.067-.202.371-.405.742-.64 1.113Z" fill="#00985F"/><path fill-rule="evenodd" clip-rule="evenodd" d="M122.276 39.364H130V15.45h-7.724v8.77h-7.286v-8.77h-7.759v23.915h7.759v-9.006h7.286v9.006ZM30.662 12.885a1.75 1.75 0 0 1 0-2.462 1.75 1.75 0 0 1 2.462 0 1.751 1.751 0 0 1 0 2.462 1.75 1.75 0 0 1-2.462 0Zm2.26 11.3c2.968-4.79 3.98-12.345 3.98-12.345l-1.147-.506c-.135-.034-.202-.203-.034-.338l.844-1.045c-.54-1.046-2.429-2.733-5.229-2.733-1.653 0-3.103.439-4.418 1.282 0 0-1.89 1.282-4.655 3.677-3.171 2.732-7.489 6.949-11.402 12.346-.1.168.034.337.17.337h5.025c3.306 0 7.59-.607 12.008-5.296.102-.101.169-.101.27-.067.101.067.101.168.068.27-.709 1.686-2.429 5.127-5.633 7.184h4.283c2.834-.034 4.959-1.383 5.87-2.766Zm-4.352 5.768c3.576-1.72 5.127-3.407 6.747-6.78 1.956 4.993 4.047 10.423 5.97 16.191H31.91l-3.34-9.41ZM0 39.364h9.478l3.205-10.018H3.44C2.36 32.348 1.18 35.62 0 39.364Zm12.818-21.486c-.506.438-1.113.54-1.788.54H7.185C11.13 8.904 14.505 1.888 15.415 0h10.626c.438.91 1.383 2.935 2.732 5.87-2.16.606-3.778 1.888-6.41 4.047-.539-1.35-1.045-2.597-1.618-3.845-1.08 2.327-2.16 5.127-3.137 7.859l-4.79 3.947Zm58.59 18.855.507 2.631h6.274V15.45H70.43v16.596c-.641.81-2.058 1.652-3.239 1.652-2.158 0-3.339-1.248-3.339-3.474V15.45H56.13v16.596c-.641.81-2.193 1.652-3.475 1.652-1.99 0-3.103-1.248-3.103-3.474V15.45h-7.724v15.786c0 5.768 2.496 8.602 7.724 8.602 3.778 0 5.97-1.383 7.725-3.239 1.18 2.16 3.373 3.239 6.577 3.239 3.778.033 5.87-1.316 7.556-3.104Zm24.557-4.688c-.708.81-1.855 1.652-3.744 1.652-2.091 0-3.238-1.956-3.238-5.666 0-4.588 1.248-6.881 3.744-6.881 1.45 0 2.193.1 3.238.337v10.558Zm-6.341 7.825h.236c3.44-.033 5.835-1.214 7.15-3.137l.406 2.631h6.307V16.461c-2.529-.81-5.43-1.484-10.861-1.484-7.724 0-11.94 4.722-11.94 13.357 0 7.994 2.968 11.503 8.702 11.536Z" fill="#E0001A"/></svg>`,
  Лента: `<svg xmlns="http://www.w3.org/2000/svg" width="91" height="30" viewBox="0 0 91 30" fill="none"><script xmlns=""/><g clip-path="url(#a)"><path d="M0 19.04a10.323 10.323 0 0 0 9.498 6.277A10.32 10.32 0 0 0 0 19.04ZM9.5 25.32a7.74 7.74 0 0 0 7.049-4.539 7.742 7.742 0 0 0-7.049 4.54Z" fill="#12B36A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9.497 20.158a7.74 7.74 0 1 0-.001-15.477 7.74 7.74 0 0 0 .001 15.477Zm0-3.869a3.87 3.87 0 1 0 0-7.74 3.87 3.87 0 0 0 0 7.74Z" fill="#FEBE10"/><path d="M9.497 16.29a3.87 3.87 0 1 0 0-7.74 3.87 3.87 0 0 0 0 7.74ZM59.294 12.421h3.238V24.97h-3.238v-4.887h-5.652v4.887h-3.237V12.421h3.237v4.625h5.652V12.42Zm4.762 3.113h4.03v9.435h3.238v-9.435h3.982V12.42h-11.25v3.113Zm26.947 6.706v2.667c-.552.276-1.242.414-2.047.414-1.681 0-2.528-.732-2.867-1.91l-.054.079c-.98 1.229-2.334 1.831-4.09 1.831-1.683 0-3.114-.627-4.318-1.907-1.18-1.28-1.781-2.861-1.781-4.719 0-1.855.602-3.412 1.781-4.692 1.204-1.279 2.635-1.933 4.317-1.933 1.679 0 2.99.553 3.958 1.677v-1.325h3.238v8.876c0 .759.345 1.149 1.035 1.149.323 0 .598-.07.828-.207Zm-4.968-3.545c0-1.028-.326-1.881-1.004-2.534-.652-.677-1.48-1.004-2.485-1.004-1.004 0-1.831.326-2.484 1.004-.653.653-.979 1.506-.979 2.534 0 1.03.326 1.883.979 2.56.653.653 1.48.979 2.484.979s1.833-.326 2.485-.979c.678-.677 1.004-1.53 1.004-2.56Zm-62.3-6.274-.097 4.715c-.022 1.909-.092 2.852-.368 3.931-.253 1.035-.736 1.328-1.493 1.328-.254 0-.483-.024-.668-.093v2.667c.253.138.668.206 1.22.206 2.275-.068 3.379-1.142 3.931-3.073.39-1.38.46-2.438.53-4.024l.072-2.545h4.02v9.435h3.237V12.421H23.735Zm15.591 7.121c.349 2.142 2.047 2.843 3.77 2.843 1.14 0 2.337-.446 3.073-1.113l1.997 2.008c-1.193 1.32-2.853 2.041-5.121 2.041-3.176 0-7.008-1.875-7.008-6.626 0-4.75 3.69-6.625 6.823-6.625 3.964 0 5.604 1.862 5.604 3.95 0 3.413-4.337 4.99-9.138 3.522Zm5.623-3.152c0-.974-.962-1.409-2.041-1.409-1.648 0-3.076.696-3.51 2.487 3.358.97 5.551.246 5.551-1.078Z" fill="#003C96"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h91.003v30H0z"/></clipPath></defs><script xmlns=""/></svg>`,
  Перекрёсток: `<svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.674 11.381l-4.713 4.682-4.714-4.682c-2.6-2.583-2.6-6.78 0-9.444 2.6-2.583 6.827-2.583 9.427 0 2.6 2.664 2.6 6.861 0 9.444z" fill="#5FAF2D"/><path d="M13.247 24.618l4.714-4.681 4.713 4.681c2.6 2.583 2.6 6.78 0 9.444-2.6 2.583-6.826 2.583-9.427 0-2.6-2.663-2.6-6.86 0-9.444z" fill="#005A28"/><path d="M24.62 22.763l-4.714-4.762 4.714-4.682c2.6-2.583 6.826-2.583 9.427 0 2.6 2.583 2.6 6.78 0 9.444-2.6 2.583-6.827 2.583-9.427 0z" fill="#1EAF37"/><path d="M11.377 13.319l4.714 4.682-4.714 4.681c-2.6 2.584-6.826 2.584-9.427 0-2.6-2.583-2.6-6.78 0-9.444 2.52-2.502 6.827-2.502 9.427.081z" fill="#AAE641"/></svg>`,
  ВкусВилл: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#50B946"/><path d="M12 4L15 9L12 14L9 9L12 4Z" fill="white"/><path d="M12 20L8 13L12 16L16 13L12 20Z" fill="white"/></svg>`,
  Окей: `<img src="/logotype.png">`,
};

// Предопределённые магазины
const availableStores = ref([
  {
    id: 1,
    name: 'Пятёрочка',
    isName: true,
    logo: storeLogos['Пятёрочка'],
    selected: false,
    color: '#fff',
  },
  {
    id: 2,
    name: 'Магнит',
    isName: false,
    logo: storeLogos['Магнит'],
    selected: false,
    color: '#fff',
  },
  {
    id: 3,
    name: 'Евроспар',
    isName: false,
    logo: storeLogos['Евроспар'],
    selected: false,
    color: '#fff',
  },
  {
    id: 4,
    name: 'Лента',
    isName: false,
    logo: storeLogos['Лента'],
    selected: false,
    color: '#fff',
  },
  {
    id: 5,
    name: 'Окей',
    isName: true,
    logo: storeLogos['Окей'],
    selected: false,
    color: '#f00',
  },
  {
    id: 6,
    name: 'Ашан',
    isName: true,
    logo: storeLogos['Ашан'],
    selected: false,
    color: '#fff',
  },
  {
    id: 7,
    name: 'ВкусВилл',
    isName: true,
    logo: storeLogos['ВкусВилл'],
    selected: false,
    color: '#50B946',
  },
  {
    id: 8,
    name: 'Перекрёсток',
    isName: true,
    logo: storeLogos['Перекрёсток'],
    selected: false,
    color: '#fff',
  },
  {
    id: 9,
    name: 'КБ',
    isName: true,
    logo: storeLogos['КБ'],
    selected: false,
    color: '#eb2316',
  },
]);

const userId = computed(() => {
  let id = localStorage.getItem('userId');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', id);
  }
  return id;
});

const saveToHistoryWithCost = () => {
  const list = productsList.value[storeName];
  if (!list || list.length === 0) return;

  // Если пользователь ввел стоимость - сохраняем ее
  const cost = parseFloat(purchaseCost.value) || 0;

  const historyItem = {
    id: Date.now(),
    date: new Date().toISOString(),
    store: storeName,
    products: [...list],
    totalCost: cost, // Добавляем поле стоимости
    storeLogo: storeInfo?.logo,
    storeColor: storeInfo?.color,
  };

  shoppingHistory.value.unshift(historyItem);
  saveDataSync();

  // Если есть стоимость - отправляем в бюджет
  if (cost > 0) {
    // Здесь мы будем вызывать функцию добавления расхода в бюджет
    addExpenseToBudget(storeName, cost);
  }

  showCostModal.value = false;
  purchaseCost.value = '';
};
// Группировка истории по датам
const groupedHistory = computed(() => {
  const groups = {};
  shoppingHistory.value.forEach((item) => {
    const dateKey = new Date(item.date).toLocaleDateString('ru-RU');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });
  return groups;
});

const sortedProductsList = computed(() => {
  const result = {};
  for (const storeName in productsList.value) {
    if (!productsList.value[storeName]) {
      result[storeName] = [];
      continue;
    }
    // Сортируем: false (незачёркнутые) идут первыми, true (зачёркнутые) - последними
    result[storeName] = [...productsList.value[storeName]].sort((a, b) => {
      return a.completed === b.completed ? 0 : a.completed ? 1 : -1;
    });
  }
  return result;
});

// Функция для получения иконки или буквы
const getStoreDisplay = (store) => {
  if (!store) return '';
  if (store.logo) {
    return store.logo;
  }
  if (!store.name) return '';
  const words = store.name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return store.name.slice(0, 2).toUpperCase();
};

const loadData = () => {
  const savedStores = localStorage.getItem('userStores');
  const savedProductsList = localStorage.getItem('productsList');
  const savedHistory = localStorage.getItem('shoppingHistory');
  const savedAvailableStores = localStorage.getItem('allAvailableStores');

  // Восстанавливаем availableStores (с выбранными магазинами)
  if (savedAvailableStores) {
    const available = JSON.parse(savedAvailableStores);
    // Обновляем availableStores, сохраняя предопределённые id
    for (const store of availableStores.value) {
      const found = available.find((s) => s.id === store.id);
      if (found) {
        store.selected = found.selected;
        if (found.color) store.color = found.color;
      }
    }
    // Добавляем кастомные магазины из сохранённых
    const customStores = available.filter(
      (s) => s.custom && !availableStores.value.find((ex) => ex.id === s.id)
    );
    if (customStores.length > 0) {
      availableStores.value.push(...customStores);
    }
  }

  if (savedStores) {
    stores.value = JSON.parse(savedStores);
    if (stores.value.length > 0) {
      showStoreModal.value = false;
    }
  }

  if (savedProductsList) {
    productsList.value = JSON.parse(savedProductsList);
  }

  if (savedHistory) {
    shoppingHistory.value = JSON.parse(savedHistory);
  }
};

const saveDataSync = async () => {
  localStorage.setItem('userStores', JSON.stringify(stores.value));
  localStorage.setItem('productsList', JSON.stringify(productsList.value)); // <-- productsList
  localStorage.setItem(
    'shoppingHistory',
    JSON.stringify(shoppingHistory.value)
  );
  localStorage.setItem(
    'allAvailableStores',
    JSON.stringify(availableStores.value)
  );

  const allSelected = availableStores.value.filter((s) => s.selected);
  localStorage.setItem('allSelectedStores', JSON.stringify(allSelected));

  if (roomId) {
    await syncToFirebase();
  }
};

const parseProductsToList = (storeName, text) => {
  if (!text || typeof text !== 'string') {
    productsList.value[storeName] = [];
    return;
  }

  const lines = text.split('\n').filter((line) => line && line.trim());
  productsList.value[storeName] = lines.map((line) => ({
    id: Date.now() + Math.random(),
    name: line.trim(),
    completed: false,
  }));
};

const updateProductsText = (storeName, text) => {
  productsText.value[storeName] = text;
  parseProductsToList(storeName, text);
  saveDataSync();
};

// Функция для определения контрастного цвета текста (белый или чёрный)
const getContrastColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) return '#000000';

  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? '#1a1a1a' : '#ffffff';
};

const saveStores = () => {
  const newlySelectedStores = availableStores.value.filter(
    (store) => store.selected
  );

  const existingStoreNames = stores.value.map((s) => s.name);
  const storesToAdd = newlySelectedStores.filter(
    (s) => !existingStoreNames.includes(s.name)
  );

  if (storesToAdd.length === 0 && newlySelectedStores.length > 0) {
    showStoreModal.value = false;
    return;
  }

  if (storesToAdd.length === 0) {
    alert('Выберите хотя бы один магазин');
    return;
  }

  stores.value = [...stores.value, ...storesToAdd];

  storesToAdd.forEach((store) => {
    if (!productsList.value[store.name]) {
      productsList.value[store.name] = [];
    }
  });

  saveDataSync();
  showStoreModal.value = false;
};

const addCustomStore = () => {
  if (!newStoreName.value.trim()) {
    alert('Введите название магазина');
    return;
  }

  // Проверка на дубликат
  const exists = availableStores.value.some(
    (store) =>
      store.name.toLowerCase() === newStoreName.value.trim().toLowerCase()
  );
  if (exists) {
    alert('Такой магазин уже есть в списке!');
    return;
  }

  const customStore = {
    id: Date.now(),
    name: newStoreName.value.trim(),
    logo: null,
    selected: false,
    custom: true,
    color: newStoreColor.value,
    isName: true,
  };

  availableStores.value.push(customStore);

  // Сразу синхронизируем с партнером
  saveDataSync();

  newStoreName.value = '';
  newStoreColor.value = '#9E9E9E';
  showAddStore.value = false;
};

// Двойной клик/тап на продукт
const toggleProductComplete = (storeName, productId) => {
  console.log('🔘 Клик по продукту:', productId);

  const products = productsList.value[storeName];
  if (!products) return;

  const productIndex = products.findIndex((p) => p.id === productId);
  if (productIndex === -1) return;

  // Меняем статус
  products[productIndex].completed = !products[productIndex].completed;

  // Сохраняем
  saveDataSync();

  // ПРОВЕРЯЕМ, ВСЕ ЛИ ЗАЧЁРКНУТЫ
  const allCompleted = products.every((p) => p.completed);
  if (allCompleted && products.length > 0) {
    pendingStoreForCost.value = storeName;
    showCostModal.value = true;
  }
};

const saveWithCost = (skip = false) => {
  const storeName = pendingStoreForCost.value;
  const list = productsList.value[storeName];
  if (!list || list.length === 0) return;

  const storeInfo = stores.value.find((s) => s.name === storeName);
  const cost = parseFloat(purchaseCost.value) || 0;

  // Если не пропускаем — добавляем в историю
  if (!skip) {
    const historyItem = {
      id: Date.now(),
      date: new Date().toISOString(),
      store: storeName,
      products: [...list], // Сохраняем копию списка
      totalCost: cost,
      storeLogo: storeInfo?.logo,
      storeColor: storeInfo?.color,
    };
    shoppingHistory.value.unshift(historyItem);
  }

  // В бюджет
  const budgetExpenses = JSON.parse(
    localStorage.getItem('budgetExpenses') || '[]'
  );
  const newExpense = {
    id: Date.now(),
    name: `Покупка в ${storeName}`,
    amount: cost,
    date: new Date().toISOString().slice(0, 10),
    unrated: cost === 0,
  };
  budgetExpenses.push(newExpense);
  localStorage.setItem('budgetExpenses', JSON.stringify(budgetExpenses));

  const budgetData = JSON.parse(
    localStorage.getItem('budgetData') ||
      '{"amount":0,"endDate":null,"expenses":[]}'
  );
  budgetData.expenses = budgetExpenses;
  localStorage.setItem('budgetData', JSON.stringify(budgetData));

  if (roomId) {
    updateDoc(doc(db, 'rooms', roomId), { budget: budgetData })
      .then(() => console.log('✅ Бюджет отправлен в Firebase'))
      .catch((e) => console.error('❌ Ошибка отправки бюджета:', e));
  }

  // ОЧИЩАЕМ СПИСОК ПРОДУКТОВ
  productsList.value[storeName] = [];

  // Сохраняем изменения
  saveDataSync();

  // Сбрасываем модалку
  purchaseCost.value = '';
  showCostModal.value = false;
  pendingStoreForCost.value = '';
};

// Обработчик для тач-событий на телефоне
const handleProductTap = (storeName, productId) => {
  toggleProductComplete(storeName, productId);
};

const saveToHistory = (storeName) => {
  const list = productsList.value[storeName];
  if (!list || list.length === 0) return;

  const storeInfo = stores.value.find((s) => s.name === storeName);

  const historyItem = {
    id: Date.now(),
    date: new Date().toISOString(),
    store: storeName,
    products: [...list],
    storeLogo: storeInfo?.logo,
    storeColor: storeInfo?.color,
  };

  shoppingHistory.value.unshift(historyItem);
  saveDataSync();
};

const toggleStoreSelection = (store) => {
  store.selected = !store.selected;
  saveDataSync();
};

const loadHistoryItem = (item) => {
  productsList.value[item.store] = [
    ...item.products.map((p) => ({ ...p, completed: false })),
  ];
  productsText.value[item.store] = item.products.map((p) => p.name).join('\n');
  saveDataSync();
  activeTab.value = 'products';
  showHistoryModal.value = false;
};

const openHistoryDetails = (item) => {
  selectedHistoryItem.value = item;
  showHistoryModal.value = true;
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const deleteProduct = (storeName, productId) => {
  productsList.value[storeName] = productsList.value[storeName].filter(
    (p) => p.id !== productId
  );
  productsText.value[storeName] = productsList.value[storeName]
    .map((p) => p.name)
    .join('\n');
  saveDataSync();
  syncToFirebase();
};

const removeStore = (storeName) => {
  stores.value = stores.value.filter((s) => s.name !== storeName);
  // Также убираем selected у availableStores
  const availStore = availableStores.value.find((s) => s.name === storeName);
  if (availStore) availStore.selected = false;
  delete productsText.value[storeName];
  delete productsList.value[storeName];
  saveDataSync();
  syncToFirebase();
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const openEdit = (store) => {
  editingStore.value = store;
  const products = productsList.value[store.name] || [];
  tempProductsText.value = products.map((p) => p.name).join('\n');
};

const closeEdit = () => {
  editingStore.value = null;
  tempProductsText.value = '';
};

const saveEdit = () => {
  if (editingStore.value) {
    const storeName = editingStore.value.name;
    const lines = tempProductsText.value
      .split('\n')
      .filter((line) => line.trim());
    const oldProducts = productsList.value[storeName] || [];

    const newProducts = lines.map((line) => {
      const trimmedLine = line.trim();
      const existing = oldProducts.find((p) => p.name === trimmedLine);
      return {
        id: existing?.id || Date.now() + Math.random(),
        name: trimmedLine,
        completed: existing?.completed || false,
      };
    });

    productsList.value[storeName] = newProducts;
    editingStore.value = null;
    tempProductsText.value = '';
    saveDataSync();
  }
};

const setupRealtimeSync = () => {
  if (!roomId) return;

  unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();

      if (data.lastChangedBy !== userId.value) {
        // Проверяем изменения в продуктах
        if (data.productsList) {
          const remoteProducts = data.productsList;
          const localProducts = productsList.value;

          // Находим конкретный магазин, который изменился
          let changedStore = null;
          for (const storeName in remoteProducts) {
            const remoteStore = JSON.stringify(remoteProducts[storeName] || []);
            const localStore = JSON.stringify(localProducts[storeName] || []);
            if (remoteStore !== localStore) {
              changedStore = storeName;
              break;
            }
          }

          // Показываем уведомление только для изменившегося магазина
          if (changedStore) {
            notifyListUpdated(changedStore);
          }

          productsList.value = remoteProducts;
          localStorage.setItem('productsList', JSON.stringify(remoteProducts));
        }

        // Остальная синхронизация магазинов...
        if (data.availableStores) {
          const remoteStores = data.availableStores;
          const currentStoreIds = availableStores.value.map((s) => s.id);
          const newStores = remoteStores.filter(
            (s) => !currentStoreIds.includes(s.id)
          );

          if (newStores.length > 0) {
            availableStores.value = [...availableStores.value, ...newStores];
          }
        }

        if (data.stores) {
          const remoteStores = data.stores;
          const currentStoreNames = stores.value.map((s) => s.name);
          const newStores = remoteStores.filter(
            (s) => !currentStoreNames.includes(s.name)
          );

          if (newStores.length > 0) {
            stores.value = [...stores.value, ...newStores];
            localStorage.setItem('userStores', JSON.stringify(stores.value));
          }
        }

        // Синхронизация истории
        if (data.history) {
          shoppingHistory.value = data.history;
          localStorage.setItem('shoppingHistory', JSON.stringify(data.history));
        }

        // Синхронизация бюджета
        if (data.budget) {
          localStorage.setItem('budgetData', JSON.stringify(data.budget));
          window.dispatchEvent(
            new CustomEvent('budgetUpdated', { detail: data.budget })
          );
        }

        window.dispatchEvent(new Event('storesUpdated'));
      }
    }
  });
};

const deleteHistoryItem = (item) => {
  if (confirm('Вы уверены, что хотите удалить эту покупку из истории?')) {
    const index = shoppingHistory.value.findIndex((h) => h.id === item.id);
    if (index !== -1) {
      shoppingHistory.value.splice(index, 1);
      saveDataSync();
      showHistoryModal.value = false;
      selectedHistoryItem.value = null;
    }
  }
};

// При добавлении продукта отправляем в Firebase
const syncToFirebase = async (changedBy = null) => {
  if (!roomId) return;

  const budgetData = JSON.parse(
    localStorage.getItem('budgetData') ||
      '{"amount":0,"endDate":null,"expenses":[]}'
  );

  const cleanData = (data) => {
    if (data === undefined || data === null) return null;
    if (Array.isArray(data)) {
      return data.map((item) => cleanData(item));
    }
    if (typeof data === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          cleaned[key] = cleanData(value);
        }
      }
      return cleaned;
    }
    return data;
  };

  const dataToSync = {
    stores: cleanData(stores.value) || [],
    availableStores: cleanData(availableStores.value) || [],
    productsList: cleanData(productsList.value) || {},
    history: cleanData(shoppingHistory.value) || [],
    budget: cleanData(budgetData) || { amount: 0, endDate: null, expenses: [] },
    lastChangedBy: userId.value,
  };

  try {
    await updateDoc(doc(db, 'rooms', roomId), dataToSync);
    console.log('✅ Данные успешно отправлены в Firebase');
  } catch (e) {
    console.error('❌ Ошибка синхронизации:', e);
  }
};

onMounted(() => {
  loadData();
  setupRealtimeSync();

  // Запрос разрешения на уведомления
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

// Очистка
onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<template>
  <div class="stores-app">
    <InviteRoom
      :stores="stores"
      :productsText="productsText"
      :shoppingHistory="shoppingHistory"
      @update-stores="stores = $event"
      @update-products="
        productsText = $event;
        Object.keys($event).forEach((store) =>
          parseProductsToList(store, $event[store])
        );
      "
      @update-history="shoppingHistory = $event"
    />
    <!-- Модальное окно выбора магазинов -->
    <div
      v-if="showStoreModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
      >
        <div class="pb-6 pl-6 pr-6 relative">
          <div
            class="w-full flex justify-end sticky top-0 bg-white z-10 pl-4 pb-4 pt-4 border-b"
          >
            <button @click="showStoreModal = 0">
              <svg
                data-v-e68177b2=""
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path data-v-e68177b2="" d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <h2 class="text-2xl font-bold mb-2 text-center">Выберите магазины</h2>
          <p class="text-gray-500 text-center mb-6">
            В какие магазины вы чаще всего ходите?
          </p>

          <div class="space-y-2 mb-4">
            <div
              v-for="store in availableStores.filter(
                (s) => !stores.some((existing) => existing.name === s.name)
              )"
              :key="store.id"
              @click="toggleStoreSelection(store)"
              class="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-all"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                :style="{
                  backgroundColor: store.color,
                  color: getContrastColor(store.color),
                }"
              >
                <div
                  v-html="getStoreDisplay(store)"
                  class="w-8 h-8 flex items-center justify-center text-white text-sm font-bold"
                ></div>
              </div>
              <span class="ml-3 flex-1 font-medium">{{ store.name }}</span>
              <div
                class="w-6 h-6 rounded-full border-2 flex justify-center items-center"
                :class="
                  store.selected
                    ? 'bg-[var(--color2)] border-[var(--color2)]'
                    : 'border-gray-300'
                "
              >
                <UIcon
                  v-if="store.selected"
                  icon="mdi:check"
                  class="w-4 h-4 text-white"
                />
              </div>
            </div>
          </div>

          <div v-if="!showAddStore">
            <button
              @click="showAddStore = true"
              class="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
            >
              <UIcon icon="mdi:plus" class="w-5 h-5" />
              Добавить свой магазин
            </button>
          </div>

          <div v-else class="space-y-3">
            <input
              type="text"
              v-model="newStoreName"
              placeholder="Название магазина"
              class="w-full p-3 border rounded-xl focus:outline-none focus:border-[var(--color2)]"
            />

            <!-- Палитра цветов -->
            <div class="flex flex-wrap gap-2 mt-2">
              <div
                v-for="color in [
                  '#E31E24',
                  '#008F32',
                  '#0057B8',
                  '#FDB913',
                  '#12B36A',
                  '#50B946',
                  '#ED1C24',
                  '#9E9E9E',
                  '#FF6B00',
                  '#8B5CF6',
                  '#EC4899',
                  '#06B6D4',
                  '#10B981',
                  '#F59E0B',
                  '#EF4444',
                ]"
                :key="color"
                @click="newStoreColor = color"
                class="w-8 h-8 rounded-full cursor-pointer border-2 transition-all"
                :class="
                  newStoreColor === color
                    ? 'border-black scale-110'
                    : 'border-gray-300'
                "
                :style="{ backgroundColor: color }"
              ></div>
            </div>

            <div class="flex gap-2">
              <button
                @click="addCustomStore"
                class="flex-1 bg-[var(--color2)] text-white py-3 rounded-xl font-semibold"
              >
                Добавить
              </button>
              <button
                @click="showAddStore = false"
                class="flex-1 bg-gray-200 py-3 rounded-xl font-semibold"
              >
                Отмена
              </button>
            </div>
          </div>

          <button
            @click="saveStores"
            class="w-full mt-6 bg-[var(--color2)] text-white py-3 rounded-xl font-semibold text-lg"
          >
            Начать покупки
          </button>
        </div>
      </div>
    </div>

    <!-- Основной контент -->
    <div v-if="!showStoreModal">
      <div class="flex gap-2 sticky mb-4 top-0 z-10">
        <button
          @click="activeTab = 'products'"
          class="flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          :class="
            activeTab === 'products'
              ? 'bg-[var(--color2)] text-white'
              : 'bg-gray-100 text-gray-600'
          "
        >
          <UIcon icon="mdi:shopping" class="w-5 h-5" />
          Список
        </button>
        <button
          @click="activeTab = 'history'"
          class="flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          :class="
            activeTab === 'history'
              ? 'bg-[var(--color2)] text-white'
              : 'bg-gray-100 text-gray-600'
          "
        >
          <UIcon icon="mdi:history" class="w-5 h-5" />
          История
        </button>
      </div>

      <div v-if="activeTab === 'products'" class="space-y-4 pb-24">
        <div
          v-for="store in stores"
          :key="store.name"
          class="bg-white rounded-2xl shadow-md overflow-hidden"
        >
          <div
            class="p-4 text-white flex justify-between items-center"
            :style="{ backgroundColor: 'var(--color2)' }"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                :style="{
                  backgroundColor: store.color || 'var(--color2)',
                  color: getContrastColor(store.color || 'var(--color2)'),
                }"
                v-html="getStoreDisplay(store)"
              ></div>
              <h3 class="font-bold text-lg">{{ store.name }}</h3>
            </div>
            <div class="flex gap-2">
              <button
                @click="removeStore(store.name)"
                class="text-white/90 hover:text-white"
              >
                <UIcon icon="mdi:delete" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            v-if="showCostModal"
            class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <div class="bg-white rounded-2xl w-full max-w-md p-6">
              <h3 class="text-xl font-bold mb-4 text-center">
                Стоимость покупки
              </h3>
              <div class="relative mb-4">
                <span
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base font-bold"
                  >₽</span
                >
                <input
                  type="number"
                  v-model="purchaseCost"
                  class="w-full bg-gray-50 border border-gray-200 p-4 pl-10 rounded-xl text-right text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color2)]"
                  placeholder="0"
                  inputmode="numeric"
                />
              </div>
              <div class="flex gap-2">
                <button
                  @click="saveToHistoryWithCost(currentStoreForCost)"
                  class="flex-1 bg-[var(--color2)] text-white py-3 rounded-xl font-semibold"
                >
                  Сохранить
                </button>
                <button
                  @click="showCostModal = false"
                  class="flex-1 bg-gray-200 py-3 rounded-xl font-semibold"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="showCostModal"
            class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <div class="bg-white rounded-2xl w-full max-w-md p-6">
              <h3 class="text-xl font-bold mb-2 text-center">
                Покупка завершена!
              </h3>
              <p class="text-gray-500 text-center mb-4">
                Сколько вы заплатили?
              </p>

              <div class="relative mb-4">
                <span
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base font-bold"
                  >₽</span
                >
                <input
                  type="number"
                  v-model="purchaseCost"
                  class="w-full bg-gray-50 border border-gray-200 p-4 pl-10 rounded-xl text-right text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color2)]"
                  placeholder="0"
                  inputmode="numeric"
                />
              </div>

              <div class="flex gap-2">
                <button
                  @click="saveWithCost(false)"
                  class="flex-1 bg-[var(--color2)] text-white py-3 rounded-xl font-semibold"
                >
                  Сохранить
                </button>
                <button
                  @click="
                    purchaseCost = '0';
                    saveWithCost(true);
                  "
                  class="flex-1 bg-gray-200 py-3 rounded-xl font-semibold"
                >
                  Пропустить
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="sortedProductsList[store.name]?.length > 0"
            class="divide-y"
          >
            <div
              v-for="product in sortedProductsList[store.name]"
              :key="product.id"
              @click="handleProductTap(store.name, product.id)"
              class="p-3 flex justify-between items-center hover:bg-gray-50 group cursor-pointer touch-manipulation"
            >
              <div class="flex items-center gap-3">
                <UIcon
                  :icon="
                    product.completed
                      ? 'mdi:check-circle'
                      : 'mdi:checkbox-blank-circle'
                  "
                  :class="
                    product.completed
                      ? 'text-green-500'
                      : 'text-[var(--color2)]'
                  "
                  class="w-5 h-5"
                />
                <span
                  :class="
                    product.completed
                      ? 'line-through text-gray-400'
                      : 'text-gray-700'
                  "
                  class="text-base"
                >
                  {{ product.name }}
                </span>
              </div>
              <button
                @click.stop="deleteProduct(store.name, product.id)"
                class="opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
              >
                <UIcon icon="mdi:close" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            v-else
            class="p-6 text-center text-gray-400"
            @click="openEdit(store)"
          >
            <UIcon
              icon="mdi:clipboard-text-outline"
              class="w-12 h-12 mx-auto mb-2 opacity-50"
            />
            <p>Нет продуктов</p>
            <p class="text-sm">Нажмите чтобы добавить</p>
          </div>
        </div>

        <div
          v-if="stores.length === 0"
          @click="showStoreModal = true"
          class="w-full h-32 border border-dashed border-gray-400 rounded-2xl flex justify-center items-center text-5xl text-gray-400"
        >
          +
        </div>

        <button
          @click="showStoreModal = true"
          class="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
          :style="{ backgroundColor: 'var(--color2)' }"
        >
          <UIcon icon="mdi:plus" class="w-6 h-6" />
        </button>
      </div>

      <div v-if="activeTab === 'history'" class="p-4 space-y-6 pb-24">
        <div
          v-for="(items, dateKey) in groupedHistory"
          :key="dateKey"
          class="space-y-3"
        >
          <h3
            class="text-lg font-bold text-gray-700 sticky top-14 py-2 rounded-lg text-start"
          >
            {{ dateKey }}
          </h3>
          <div
            v-for="item in items"
            :key="item.id"
            class="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            @click="openHistoryDetails(item)"
          >
            <div
              class="p-4"
              :style="{
                borderLeft: `4px solid ${item.storeColor || 'var(--color2)'}`,
              }"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-2">
                  <div class="font-bold text-lg">{{ item.store }}</div>
                </div>
                <div class="text-sm text-gray-500 flex items-center gap-1">
                  <UIcon icon="mdi:clock" class="w-4 h-4" />
                  {{ formatTime(item.date) }}
                </div>
              </div>
              <div class="mt-2 flex flex-wrap gap-1">
                <span
                  v-for="product in item.products.slice(0, 3)"
                  :key="product.id"
                  class="text-xs bg-gray-100 px-2 py-1 rounded-full"
                >
                  {{ product.name }}
                </span>
                <span
                  v-if="item.products.length > 3"
                  class="text-xs text-gray-500"
                >
                  +{{ item.products.length - 3 }}...
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="shoppingHistory.length === 0"
          class="text-center text-gray-400 py-10"
        >
          <UIcon icon="mdi:history" class="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p>Пока нет сохранённых покупок</p>
        </div>
      </div>
    </div>

    <!-- Модальное окно редактирования -->
    <div
      v-if="editingStore"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl w-full max-w-md">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold flex items-center gap-2">
            <div
              class="rounded-full flex justify-center items-center text-sm font-bold"
              :class="
                editingStore.isName == null
                  ? 'w-8 h-8'
                  : editingStore.isName
                  ? 'w-8 h-8'
                  : ' '
              "
              :style="{
                backgroundColor: editingStore.color,
                color: getContrastColor(editingStore.color),
              }"
              v-html="getStoreDisplay(editingStore)"
            ></div>
            <span>
              {{
                editingStore.isName == null
                  ? editingStore.name
                  : editingStore.isName
                  ? editingStore.name
                  : ''
              }}
            </span>
          </h3>
          <button @click="closeEdit" class="text-gray-500">
            <UIcon icon="mdi:close" class="w-6 h-6" />
          </button>
        </div>

        <div class="p-4">
          <textarea
            v-model="tempProductsText"
            placeholder="Введите список продуктов&#10;Каждый продукт с новой строки&#10;&#10;Пример:&#10;Молоко 1л&#10;Хлеб белый&#10;Яйца 10шт"
            class="w-full h-64 p-3 border rounded-xl resize-none focus:outline-none focus:border-[var(--color2)] font-mono text-sm"
          ></textarea>

          <div class="flex gap-2 mt-4">
            <button
              @click="saveEdit"
              class="flex-1 bg-[var(--color2)] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <UIcon icon="mdi:check" class="w-5 h-5" />
              Сохранить
            </button>
            <button
              @click="closeEdit"
              class="flex-1 bg-gray-200 py-3 rounded-xl font-semibold"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно просмотра истории -->
    <div
      v-if="showHistoryModal && selectedHistoryItem"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
      >
        <div
          class="p-4 border-b flex justify-between items-center sticky top-0 bg-white"
        >
          <h3 class="text-xl font-bold flex items-center gap-2">
            {{ selectedHistoryItem.store }}
          </h3>
          <button @click="showHistoryModal = false" class="text-gray-500">
            <UIcon icon="mdi:close" class="w-6 h-6" />
          </button>
        </div>

        <div class="p-4">
          <div
            class="text-sm text-gray-500 flex items-center gap-2 mb-4 pb-2 border-b"
          >
            <UIcon icon="mdi:calendar" class="w-4 h-4" />
            {{ formatDate(selectedHistoryItem.date) }}
          </div>

          <div class="space-y-2">
            <div
              v-for="product in selectedHistoryItem.products"
              :key="product.id"
              class="p-2 flex items-center gap-3 hover:bg-gray-50 rounded-lg"
            >
              <UIcon
                :icon="
                  product.completed
                    ? 'mdi:check-circle'
                    : 'mdi:checkbox-blank-circle'
                "
                :class="product.completed ? 'text-green-500' : 'text-gray-400'"
                class="w-4 h-4"
              />
              <span
                :class="
                  product.completed
                    ? 'line-through text-gray-400'
                    : 'text-gray-700'
                "
              >
                {{ product.name }}
              </span>
            </div>
          </div>

          <div class="mt-6 pt-3 border-t flex gap-2">
            <button
              @click="loadHistoryItem(selectedHistoryItem)"
              class="flex-1 bg-[var(--color2)] text-white py-2 rounded-xl font-semibold"
            >
              Загрузить этот список
            </button>
            <button
              @click="deleteHistoryItem(selectedHistoryItem)"
              class="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.touch-manipulation {
  touch-action: manipulation;
}
</style>
