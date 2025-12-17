/**
 * Turkish translations for ESPHome Dashboard
 */
export const tr = {
  // Common buttons
  save: "Kaydet",
  cancel: "İptal",
  close: "Kapat",
  delete: "Sil",
  install: "Yükle",
  edit: "Düzenle",
  retry: "Tekrar Dene",
  back: "Geri",
  skip: "Atla",
  yes: "Evet",
  download: "İndir",
  rename: "Yeniden Adlandır",

  // Editor
  editor: {
    saveFile: "Dosyayı kaydet",
    saved: "{fileName} kaydedildi",
    saveError: "{fileName} kaydedilirken bir hata oluştu",
  },

  // Device Card
  device: {
    update: "Güncelle",
    visit: "Ziyaret Et",
    logs: "Kayıtlar",
    validate: "Doğrula",
    showApiKey: "API Anahtarını Göster",
    downloadYaml: "YAML İndir",
    renameHostname: "Ana bilgisayar adını değiştir",
    cleanBuildFiles: "Derleme Dosyalarını Temizle",
    downloadElf: "ELF dosyasını indir",
    cleanMqtt: "MQTT Temizle",
    fullPath: "Tam Yol:",
    updateAvailable: "Güncelleme Mevcut: {deployed} → {current}",
  },

  // Device Status
  status: {
    new: "YENİ",
    online: "ÇEVRİMİÇİ",
    offline: "ÇEVRİMDIŞI",
    discovered: "KEŞFEDİLDİ",
    ignoredDiscovery: "YOKSAYILAN KEŞİF",
  },

  // Adopt Dialog
  adopt: {
    takeControl: "Kontrolü Al",
    configurationCreated: "Yapılandırma oluşturuldu",
    installationSkipped: "Kurulum atlandı",
    takeControlDescription:
      "{name} cihazının kontrolünü almak, bu cihaz için yerel bir ESPHome yapılandırması oluşturacaktır. Bu size yapılandırma üzerinde tam kontrol sağlar. Üretici tarafından sağlanan yazılım güncellemelerine erişimi kaybedeceksiniz ve cihazı ESPHome Cihaz Oluşturucu'da manuel olarak derlemeniz ve güncellemeniz gerekecektir. Her zaman üretici güncellemelerine geri dönebilirsiniz, ancak bu cihazı yeniden kurmanızı gerektirecektir.",
    finishTakingControl:
      "{name} cihazının kontrolünü tamamlamak için yeni yapılandırmanın cihaza yüklenmesi gerekmektedir.",
    installLater:
      "Yapılandırmayı daha sonra cihaz kartındaki üç nokta menüsünden yükleyebilirsiniz.",
    encryptionKeyInfo:
      "Her ESPHome cihazının diğer cihazlarla iletişim kurmak için benzersiz bir şifreleme anahtarı vardır. Home Assistant'a cihazınızı dahil etmek için bu anahtara ihtiyacınız olacak. Anahtarı daha sonra cihaz menüsünde bulabilirsiniz.",
    encryptionKey: "Şifreleme anahtarı",
    copied: "Kopyalandı!",
    takingControl: "Kontrol alınıyor...",
    newName: "Yeni Ad",
    networkName: "Ağ adı",
    password: "Parola",
    leaveBlankIfNoPassword: "Parola yoksa boş bırakın",
    wifiSecretsStored:
      "Bu cihaz, sırlarınızda kayıtlı Wi-Fi ağına bağlanacak şekilde yapılandırılacaktır.",
    enterWifiCredentials:
      "Cihazınızın bağlanmasını istediğiniz Wi-Fi ağının kimlik bilgilerini girin.",
    wifiCredentialsStoredInfo:
      "Bu bilgiler sırlarınızda saklanacak ve bu ve gelecekteki cihazlar için kullanılacaktır. Bilgileri daha sonra sayfanın üstündeki sırlarınızı düzenleyerek değiştirebilirsiniz.",
    failedToStoreWifi: "Wi-Fi kimlik bilgileri saklanamadı",
    failedToImport: "Cihaz içeri aktarılamadı",
  },

  // Install Choose Dialog
  installChoose: {
    howToInstall:
      "{configuration} yapılandırmasını cihazınıza nasıl yüklemek istiyorsunuz?",
    wirelessly: "Kablosuz olarak",
    viaNetwork: "Ağ üzerinden",
    requiresOnline: "Cihazın çevrimiçi olması gerekir",
    plugIntoThisComputer: "Bu bilgisayara takın",
    forDevicesConnectedViaUsb: "USB ile bu bilgisayara bağlı cihazlar için",
    webInstallNotSupported:
      "Bu cihaz için web üzerinden kurulum henüz desteklenmiyor",
    plugIntoServer: "ESPHome Cihaz Oluşturucu'nun çalıştığı bilgisayara takın",
    forDevicesConnectedToServer: "USB ile sunucuya bağlı cihazlar için{picoNote}",
    andRunningEsphome: " ve ESPHome çalıştıran",
    manualDownload: "Manuel indirme",
    installYourself: "Kendiniz yükleyin",
    byUsingEsphomeWeb: "ESPHome Web veya diğer araçları kullanarak",
    byCopyingToPico: "Pico USB sürücüsüne kopyalayarak",
    pickServerPort: "Sunucu Portu Seçin",
    loadingSerialDevices: "Seri cihazlar yükleniyor",
    noSerialDevicesFound: "Seri cihaz bulunamadı.",
    autoRefreshNote:
      "Bir cihaz taktığınızda bu liste otomatik olarak yenilenir.",
    picoRequiresEsphome:
      "Sunucu üzerinden kurulum, Pico'nun zaten ESPHome çalıştırması gerektirir.",
    downloadInstructions: {
      installViaUsb: "USB sürücüsü ile ESPHome yükleyin",
      installViaBrowser: "Tarayıcı ile ESPHome yükleyin",
      picoInstructions:
        "ESPHome projeniz {configuration} cihazınıza dosya gezgininiz aracılığıyla şu adımları izleyerek yükleyebilirsiniz:",
      browserInstructions:
        "ESPHome, belirli gereksinimler karşılanırsa tarayıcı üzerinden {configuration} yapılandırmasını cihazınıza yükleyebilir:",
      browserRequirements: {
        https: "ESPHome HTTPS üzerinden ziyaret ediliyor",
        webSerial: "Tarayıcınız WebSerial destekliyor",
      },
      requirementsNotMet:
        "Şu anda tüm gereksinimler karşılanmıyor. En kolay çözüm projenizi indirmek ve kurulumu ESPHome Web ile yapmaktır. ESPHome Web %100 tarayıcınızda çalışır ve ESPHome projesiyle hiçbir veri paylaşılmaz.",
      picoSteps: {
        disconnect: "Raspberry Pi Pico'yu bilgisayarınızdan çıkarın",
        holdBootsel:
          "BOOTSEL düğmesini basılı tutun ve Pico'yu bilgisayarınıza bağlayın. Pico, RPI-RP2 adlı bir USB sürücü olarak görünecektir",
        downloadProject: "Projeyi indir",
        dragToUsb:
          "İndirilen dosyayı USB sürücüsüne sürükleyin. Sürücü kaybolduğunda kurulum tamamlanmış demektir",
        complete: "Pico'nuz artık ESPHome projenizi çalıştırıyor 🎉",
      },
      openEsphomeWeb: "ESPHome Web'i Aç",
      preparingDownload: "indirme hazırlanıyor...",
      preparationFailed: "hazırlama başarısız:",
      seeWhatWentWrong: "neyin yanlış gittiğini gör",
    },
  },

  // Delete Dialog
  deleteDevice: {
    deleteTitle: "{name} Sil",
    confirmDelete: "{name} cihazını silmek istediğinizden emin misiniz?",
  },

  // Rename Dialog
  renameDialog: {
    renameTitle: "{configuration} Yeniden Adlandır",
    newName: "Yeni Ad",
    helperText: "Küçük harfler (a-z), rakamlar (0-9) veya tire (-)",
  },

  // Compile Dialog
  compile: {
    downloadTitle: "{configuration} İndir",
  },

  // Logs Dialog
  logs: {
    logsTitle: "Kayıtlar {configuration}",
  },

  // Header Menu
  header: {
    updateAll: "Tümünü Güncelle",
    cleanAll: "Tümünü Temizle",
    secrets: "Sırlar",
    secretsEditor: "Sırlar Düzenleyici",
    search: "Ara",
    showDiscoveredDevices: "Keşfedilen cihazları göster",
    hideDiscoveredDevices: "Keşfedilen cihazları gizle",
    logOut: "Çıkış Yap",
    updateAllConfirm: "Tüm cihazları güncellemek istiyor musunuz?",
    cleanAllConfirm:
      "Tüm derleme ve platform dosyalarını temizlemek istiyor musunuz? Bu, tüm önbelleğe alınmış dosyaları ve bağımlılıkları kaldıracaktır, bunların yeniden indirilmesi ve kurulması biraz zaman alabilir.",
  },

  // Importable Device Card
  importable: {
    takeControl: "Kontrolü Al",
    ignore: "Yoksay",
    unignore: "Yoksaymayı Kaldır",
  },

  // Footer
  footer: {
    fundDevelopment: "Geliştirmeyi destekle",
    documentation: "Dokümantasyon",
  },

  // Validation
  validate: {
    validateTitle: "{configuration} Doğrula",
  },

  // Clean Dialog
  clean: {
    cleanTitle: "{configuration} Temizle",
  },

  // Update All Dialog
  updateAll: {
    title: "Tüm Cihazları Güncelle",
  },

  // Clean All Dialog
  cleanAllDialog: {
    title: "Tüm Cihazları Temizle",
  },

  // Show API Key Dialog
  showApiKey: {
    title: "{configuration} için API Anahtarı",
    apiKey: "API Anahtarı",
    copyToClipboard: "Panoya kopyala",
  },

  // Logs Target Dialog
  logsTarget: {
    title: "{configuration} için kayıt hedefi seçin",
    ota: "OTA (Kablosuz)",
    selectPort: "Bir seri port seçin",
  },

  // Install Server Dialog
  installServer: {
    title: "{configuration} Yükle",
    installingTo: "{target} cihazına yükleniyor...",
  },

  // Install Web Dialog
  installWeb: {
    title: "{configuration} tarayıcı ile yükle",
    connecting: "Bağlanıyor...",
    selectPort: "Port Seç",
    installFirmware: "Yazılımı Yükle",
  },

  // Alerts and Messages
  alerts: {
    warning: "Uyarı",
    error: "Hata",
    success: "Başarılı",
    info: "Bilgi",
  },

  // Language
  language: {
    selectLanguage: "Dil Seçin",
    english: "İngilizce",
    turkish: "Türkçe",
  },
} as const;
