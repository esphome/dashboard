/**
 * Turkish translations for ESPHome Dashboard
 */
export const tr = {
  // Common buttons
  save: "Kaydet",
  cancel: "Iptal",
  close: "Kapat",
  delete: "Sil",
  install: "Yukle",
  edit: "Duzenle",
  retry: "Tekrar Dene",
  back: "Geri",
  skip: "Atla",
  yes: "Evet",
  download: "Indir",
  rename: "Yeniden Adlandir",

  // Editor
  editor: {
    saveFile: "Dosyayi kaydet",
    saved: "{fileName} kaydedildi",
    saveError: "{fileName} kaydedilirken bir hata olustu",
  },

  // Device Card
  device: {
    update: "Guncelle",
    visit: "Ziyaret Et",
    logs: "Kayitlar",
    validate: "Dogrula",
    showApiKey: "API Anahtarini Goster",
    downloadYaml: "YAML Indir",
    renameHostname: "Ana bilgisayar adini degistir",
    cleanBuildFiles: "Derleme Dosyalarini Temizle",
    downloadElf: "ELF dosyasini indir",
    cleanMqtt: "MQTT Temizle",
    fullPath: "Tam Yol:",
    updateAvailable: "Guncelleme Mevcut: {deployed} -> {current}",
  },

  // Device Status
  status: {
    new: "YENI",
    online: "CEVRIMICI",
    offline: "CEVRIMDISI",
    discovered: "KESFEDILDI",
    ignoredDiscovery: "YOKSAYILAN KESIF",
  },

  // Adopt Dialog
  adopt: {
    takeControl: "Kontrolu Al",
    configurationCreated: "Yapilandirma olusturuldu",
    installationSkipped: "Kurulum atlandi",
    takeControlDescription:
      "{name} cihazinin kontrolunu almak, bu cihaz icin yerel bir ESPHome yapilandirmasi olusturacaktir. Bu size yapilandirma uzerinde tam kontrol saglar. Uretici tarafindan saglanan yazilim guncellemelerine erisimi kaybedeceksiniz ve cihazi ESPHome Cihaz Olusturucu'da manuel olarak derlemeniz ve guncellemeniz gerekecektir. Her zaman uretici guncellemelerine geri donebilirsiniz, ancak bu cihazi yeniden kurmanizi gerektirecektir.",
    finishTakingControl:
      "{name} cihazinin kontrolunu tamamlamak icin yeni yapilandirmanin cihaza yuklenmesi gerekmektedir.",
    installLater:
      "Yapilandirmayi daha sonra cihaz kartindaki uc nokta menusunden yukleyebilirsiniz.",
    encryptionKeyInfo:
      "Her ESPHome cihazinin diger cihazlarla iletisim kurmak icin benzersiz bir sifreleme anahtari vardir. Home Assistant'a cihazinizi dahil etmek icin bu anahtara ihtiyaciniz olacak. Anahtari daha sonra cihaz menusunde bulabilirsiniz.",
    encryptionKey: "Sifreleme anahtari",
    copied: "Kopyalandi!",
    takingControl: "Kontrol aliniyor...",
    newName: "Yeni Ad",
    networkName: "Ag adi",
    password: "Parola",
    leaveBlankIfNoPassword: "Parola yoksa bos birakin",
    wifiSecretsStored:
      "Bu cihaz, sirlarinizda kayitli Wi-Fi agina baglanacak sekilde yapilandirilacaktir.",
    enterWifiCredentials:
      "Cihazinizin baglanmasini istediginiz Wi-Fi aginin kimlik bilgilerini girin.",
    wifiCredentialsStoredInfo:
      "Bu bilgiler sirlarinizda saklanacak ve bu ve gelecekteki cihazlar icin kullanilacaktir. Bilgileri daha sonra sayfanin ustundeki sirlarinizi duzenleyerek degistirebilirsiniz.",
    failedToStoreWifi: "Wi-Fi kimlik bilgileri saklanamadi",
    failedToImport: "Cihaz iceri aktarilamadi",
  },

  // Install Choose Dialog
  installChoose: {
    howToInstall:
      "{configuration} yapilandirmasini cihaziniza nasil yuklemek istiyorsunuz?",
    wirelessly: "Kablosuz olarak",
    viaNetwork: "Ag uzerinden",
    requiresOnline: "Cihazin cevrimici olmasi gerekir",
    plugIntoThisComputer: "Bu bilgisayara takin",
    forDevicesConnectedViaUsb: "USB ile bu bilgisayara bagli cihazlar icin",
    webInstallNotSupported:
      "Bu cihaz icin web uzerinden kurulum henuz desteklenmiyor",
    plugIntoServer: "ESPHome Cihaz Olusturucu'nun calistigi bilgisayara takin",
    forDevicesConnectedToServer: "USB ile sunucuya bagli cihazlar icin{picoNote}",
    andRunningEsphome: " ve ESPHome calistiran",
    manualDownload: "Manuel indirme",
    installYourself: "Kendiniz yukleyin",
    byUsingEsphomeWeb: "ESPHome Web veya diger araclari kullanarak",
    byCopyingToPico: "Pico USB surucusune kopyalayarak",
    pickServerPort: "Sunucu Portu Secin",
    loadingSerialDevices: "Seri cihazlar yukleniyor",
    noSerialDevicesFound: "Seri cihaz bulunamadi.",
    autoRefreshNote:
      "Bir cihaz taktiginizda bu liste otomatik olarak yenilenir.",
    picoRequiresEsphome:
      "Sunucu uzerinden kurulum, Pico'nun zaten ESPHome calistirmasi gerektirir.",
    downloadInstructions: {
      installViaUsb: "USB surucusu ile ESPHome yukleyin",
      installViaBrowser: "Tarayici ile ESPHome yukleyin",
      picoInstructions:
        "ESPHome projeniz {configuration} cihaziniza dosya gezgininiz araciligiyla su adimlari izleyerek yukleyebilirsiniz:",
      browserInstructions:
        "ESPHome, belirli gereksinimler karsilanirsa tarayici uzerinden {configuration} yapilandirmasini cihaziniza yukleyebilir:",
      browserRequirements: {
        https: "ESPHome HTTPS uzerinden ziyaret ediliyor",
        webSerial: "Tarayiciniz WebSerial destekliyor",
      },
      requirementsNotMet:
        "Su anda tum gereksinimler karsilanmiyor. En kolay cozum projenizi indirmek ve kurulumu ESPHome Web ile yapmaktir. ESPHome Web %100 tarayicinizda calisir ve ESPHome projesiyle hicbir veri paylasilmaz.",
      picoSteps: {
        disconnect: "Raspberry Pi Pico'yu bilgisayarinizdan cikarin",
        holdBootsel:
          "BOOTSEL duzgmesini basili tutun ve Pico'yu bilgisayariniza baglayyin. Pico, RPI-RP2 adli bir USB surucu olarak gorunecektir",
        downloadProject: "Projeyi indir",
        dragToUsb:
          "Indirilen dosyayi USB surucusune surukleyin. Surucu kaybolduğunda kurulum tamamlanmis demektir",
        complete: "Pico'nuz artik ESPHome projenizi calistiriyor",
      },
      openEsphomeWeb: "ESPHome Web'i Ac",
      preparingDownload: "indirme hazirlaniyor...",
      preparationFailed: "hazirlama basarisiz:",
      seeWhatWentWrong: "neyin yanlis gittigini gor",
    },
  },

  // Delete Dialog
  deleteDevice: {
    deleteTitle: "{name} Sil",
    confirmDelete: "{name} cihazini silmek istediginizden emin misiniz?",
  },

  // Rename Dialog
  renameDialog: {
    renameTitle: "{configuration} Yeniden Adlandir",
    newName: "Yeni Ad",
    helperText: "Kucuk harfler (a-z), rakamlar (0-9) veya tire (-)",
  },

  // Compile Dialog
  compile: {
    downloadTitle: "{configuration} Indir",
  },

  // Logs Dialog
  logs: {
    logsTitle: "Kayitlar {configuration}",
  },

  // Header Menu
  header: {
    updateAll: "Tumunu Guncelle",
    cleanAll: "Tumunu Temizle",
    secrets: "Sirlar",
    secretsEditor: "Sirlar Duzenleyici",
    search: "Ara",
    showDiscoveredDevices: "Kesfedilen cihazlari goster",
    hideDiscoveredDevices: "Kesfedilen cihazlari gizle",
    logOut: "Cikis Yap",
    updateAllConfirm: "Tum cihazlari guncellemek istiyor musunuz?",
    cleanAllConfirm:
      "Tum derleme ve platform dosyalarini temizlemek istiyor musunuz? Bu, tum onbellege alinmis dosyalari ve bagimliliklari kaldiracaktir, bunlarin yeniden indirilmesi ve kurulmasi biraz zaman alabilir.",
  },

  // Importable Device Card
  importable: {
    takeControl: "Kontrolu Al",
    ignore: "Yoksay",
    unignore: "Yoksaymayi Kaldir",
  },

  // Footer
  footer: {
    fundDevelopment: "Gelistirmeyi destekle",
    documentation: "Dokumantasyon",
  },

  // Validation
  validate: {
    validateTitle: "{configuration} Dogrula",
  },

  // Clean Dialog
  clean: {
    cleanTitle: "{configuration} Temizle",
  },

  // Update All Dialog
  updateAll: {
    title: "Tum Cihazlari Guncelle",
  },

  // Clean All Dialog
  cleanAllDialog: {
    title: "Tum Cihazlari Temizle",
  },

  // Show API Key Dialog
  showApiKey: {
    title: "{configuration} icin API Anahtari",
    apiKey: "API Anahtari",
    copyToClipboard: "Panoya kopyala",
  },

  // Logs Target Dialog
  logsTarget: {
    title: "{configuration} icin kayit hedefi secin",
    ota: "OTA (Kablosuz)",
    selectPort: "Bir seri port secin",
  },

  // Install Server Dialog
  installServer: {
    title: "{configuration} Yukle",
    installingTo: "{target} cihazina yukleniyor...",
  },

  // Install Web Dialog
  installWeb: {
    title: "{configuration} tarayici ile yukle",
    connecting: "Baglaniyor...",
    selectPort: "Port Sec",
    installFirmware: "Yazilimi Yukle",
  },

  // Alerts and Messages
  alerts: {
    warning: "Uyari",
    error: "Hata",
    success: "Basarili",
    info: "Bilgi",
  },

  // Language
  language: {
    selectLanguage: "Dil Secin",
    english: "Ingilizce",
    turkish: "Turkce",
  },
} as const;
