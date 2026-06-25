#!/usr/bin/env python3
"""Add 45 new i18n keys to all non-English languages in i18n.ts"""

# New keys with translations for all 16 languages
NEW_KEYS = {
    "orderNumber": {
        "en": "Order Number", "nl": "Ordernummer", "fr": "Numéro de commande",
        "de": "Bestellnummer", "es": "Número de pedido", "pl": "Numer zamówienia",
        "tr": "Sipariş Numarası", "ar": "رقم الطلب", "ro": "Număr comandă",
        "pt": "Número do pedido", "it": "Numero ordine", "cs": "Číslo objednávky",
        "uk": "Номер замовлення", "zh": "订单号", "ru": "Номер заказа", "hi": "आर्डर नंबर",
    },
    "customerName": {
        "en": "Customer Name", "nl": "Klantnaam", "fr": "Nom du client",
        "de": "Kundenname", "es": "Nombre del cliente", "pl": "Nazwa klienta",
        "tr": "Müşteri Adı", "ar": "اسم العميل", "ro": "Nume client",
        "pt": "Nome do cliente", "it": "Nome cliente", "cs": "Jméno zákazníka",
        "uk": "Ім'я клієнта", "zh": "客户名称", "ru": "Имя клиента", "hi": "ग्राहक नाम",
    },
    "transportCode": {
        "en": "Transport Code", "nl": "Transportcode", "fr": "Code transport",
        "de": "Transportcode", "es": "Código de transporte", "pl": "Kod transportu",
        "tr": "Taşıma Kodu", "ar": "رمز النقل", "ro": "Cod transport",
        "pt": "Código de transporte", "it": "Codice trasporto", "cs": "Dopravní kód",
        "uk": "Код транспорту", "zh": "运输代码", "ru": "Код транспорта", "hi": "परिवहन कोड",
    },
    "lotNumber": {
        "en": "Lot Number", "nl": "Lotnummer", "fr": "Numéro de lot",
        "de": "Chargennummer", "es": "Número de lote", "pl": "Numer partii",
        "tr": "Parti Numarası", "ar": "رقم الدفعة", "ro": "Număr lot",
        "pt": "Número do lote", "it": "Numero lotto", "cs": "Číslo šarže",
        "uk": "Номер партії", "zh": "批号", "ru": "Номер партии", "hi": "लॉट नंबर",
    },
    "grossWeightKg": {
        "en": "Gross Weight (kg)", "nl": "Brutogewicht (kg)", "fr": "Poids brut (kg)",
        "de": "Bruttogewicht (kg)", "es": "Peso bruto (kg)", "pl": "Waga brutto (kg)",
        "tr": "Bürüt Ağırlık (kg)", "ar": "الوزن الإجمالي (كجم)", "ro": "Greutate brută (kg)",
        "pt": "Peso bruto (kg)", "it": "Peso lordo (kg)", "cs": "Hrubá hmotnost (kg)",
        "uk": "Вага брутто (кг)", "zh": "毛重 (kg)", "ru": "Вес брутто (кг)", "hi": "सकल वजन (किग्रा)",
    },
    "netWeightKg": {
        "en": "Net Weight (kg)", "nl": "Nettogewicht (kg)", "fr": "Poids net (kg)",
        "de": "Nettogewicht (kg)", "es": "Peso neto (kg)", "pl": "Waga netto (kg)",
        "tr": "Net Ağırlık (kg)", "ar": "الوزن الصافي (كجم)", "ro": "Greutate netă (kg)",
        "pt": "Peso líquido (kg)", "it": "Peso netto (kg)", "cs": "Čistá hmotnost (kg)",
        "uk": "Вага нетто (кг)", "zh": "净重 (kg)", "ru": "Вес нетто (кг)", "hi": "शुद्ध वजन (किग्रा)",
    },
    "instructions": {
        "en": "Instructions", "nl": "Instructies", "fr": "Instructions",
        "de": "Anweisungen", "es": "Instrucciones", "pl": "Instrukcje",
        "tr": "Talimatlar", "ar": "تعليمات", "ro": "Instrucțiuni",
        "pt": "Instruções", "it": "Istruzioni", "cs": "Pokyny",
        "uk": "Інструкції", "zh": "指示", "ru": "Инструкции", "hi": "निर्देश",
    },
    "warehouseInstructions": {
        "en": "Warehouse Instructions", "nl": "Magazijninstructies", "fr": "Instructions d'entrepôt",
        "de": "Lageranweisungen", "es": "Instrucciones de almacén", "pl": "Instrukcje magazynowe",
        "tr": "Depo Talimatları", "ar": "تعليمات المستودع", "ro": "Instrucțiuni depozit",
        "pt": "Instruções do armazém", "it": "Istruzioni magazzino", "cs": "Skladové pokyny",
        "uk": "Складські інструкції", "zh": "仓库指示", "ru": "Складские инструкции", "hi": "गोदाम निर्देश",
    },
    "preparedBy": {
        "en": "Prepared By", "nl": "Klaargezet door", "fr": "Préparé par",
        "de": "Vorbereitet von", "es": "Preparado por", "pl": "Przygotowane przez",
        "tr": "Hazırlayan", "ar": "أعدّه", "ro": "Pregătit de",
        "pt": "Preparado por", "it": "Preparato da", "cs": "Připravil",
        "uk": "Підготував", "zh": "准备人", "ru": "Подготовил", "hi": "तैयार किया",
    },
    "checkedBy": {
        "en": "Checked By", "nl": "Nagekeken door", "fr": "Vérifié par",
        "de": "Geprüft von", "es": "Revisado por", "pl": "Sprawdzone przez",
        "tr": "Kontrol Eden", "ar": "تم التحقق بواسطة", "ro": "Verificat de",
        "pt": "Verificado por", "it": "Controllato da", "cs": "Zkontroloval",
        "uk": "Перевірив", "zh": "检查人", "ru": "Проверил", "hi": "जाँचा",
    },
    "printDocument": {
        "en": "Print Document", "nl": "Document afdrukken", "fr": "Imprimer le document",
        "de": "Dokument drucken", "es": "Imprimir documento", "pl": "Drukuj dokument",
        "tr": "Belgeyi Yazdır", "ar": "طباعة المستند", "ro": "Tipărește documentul",
        "pt": "Imprimir documento", "it": "Stampa documento", "cs": "Tisk dokumentu",
        "uk": "Друкувати документ", "zh": "打印文件", "ru": "Печать документа", "hi": "दस्तावेज़ प्रिंट करें",
    },
    "printLoadingOrder": {
        "en": "Print Loading Order", "nl": "Laadorder afdrukken", "fr": "Imprimer l'ordre de chargement",
        "de": "Ladeanweisung drucken", "es": "Imprimir orden de carga", "pl": "Drukuj zamówienie załadunku",
        "tr": "Yükleme Emri Yazdır", "ar": "طباعة أمر التحميل", "ro": "Tipărește ordinul de încărcare",
        "pt": "Imprimir ordem de carregamento", "it": "Stampa ordine di carico", "cs": "Tisk nakládacího příkazu",
        "uk": "Друкувати завантажувальний ордер", "zh": "打印装货单", "ru": "Печать погрузочного ордера", "hi": "लोडिंग ऑर्डर प्रिंट करें",
    },
    "loadingOrder": {
        "en": "Loading Order", "nl": "Laadorder", "fr": "Ordre de chargement",
        "de": "Ladeanweisung", "es": "Orden de carga", "pl": "Zamówienie załadunku",
        "tr": "Yükleme Emri", "ar": "أمر التحميل", "ro": "Ordin de încărcare",
        "pt": "Ordem de carregamento", "it": "Ordine di carico", "cs": "Nakládací příkaz",
        "uk": "Завантажувальний ордер", "zh": "装货单", "ru": "Погрузочный ордер", "hi": "लोडिंग ऑर्डर",
    },
    "laadorder": {
        "en": "Laadorder", "nl": "Laadorder", "fr": "Laadorder",
        "de": "Laadorder", "es": "Laadorder", "pl": "Laadorder",
        "tr": "Laadorder", "ar": "Laadorder", "ro": "Laadorder",
        "pt": "Laadorder", "it": "Laadorder", "cs": "Laadorder",
        "uk": "Laadorder", "zh": "Laadorder", "ru": "Laadorder", "hi": "Laadorder",
    },
    "productDetails": {
        "en": "Product Details", "nl": "Productdetails", "fr": "Détails du produit",
        "de": "Produktdetails", "es": "Detalles del producto", "pl": "Szczegóły produktu",
        "tr": "Ürün Detayları", "ar": "تفاصيل المنتج", "ro": "Detalii produs",
        "pt": "Detalhes do produto", "it": "Dettagli prodotto", "cs": "Detaily produktu",
        "uk": "Деталі продукту", "zh": "产品详情", "ru": "Детали продукта", "hi": "उत्पाद विवरण",
    },
    "productCode": {
        "en": "Product Code", "nl": "Productcode", "fr": "Code produit",
        "de": "Produktcode", "es": "Código de producto", "pl": "Kod produktu",
        "tr": "Ürün Kodu", "ar": "رمز المنتج", "ro": "Cod produs",
        "pt": "Código do produto", "it": "Codice prodotto", "cs": "Kód produktu",
        "uk": "Код продукту", "zh": "产品代码", "ru": "Код продукта", "hi": "उत्पाद कोड",
    },
    "signOff": {
        "en": "Sign-off", "nl": "Ondertekening", "fr": "Sign-off",
        "de": "Freigabe", "es": "Firma", "pl": "Podpis",
        "tr": "Onay", "ar": "توقيع", "ro": "Semnare",
        "pt": "Assinatura", "it": "Firma", "cs": "Podpis",
        "uk": "Підпис", "zh": "签收", "ru": "Подписание", "hi": "हस्ताक्षर",
    },
    "stepArrival": {
        "en": "Arrival", "nl": "Aankomst", "fr": "Arrivée",
        "de": "Ankunft", "es": "Llegada", "pl": "Przyjazd",
        "tr": "Varış", "ar": "الوصول", "ro": "Sosire",
        "pt": "Chegada", "it": "Arrivo", "cs": "Příjezd",
        "uk": "Прибуття", "zh": "到达", "ru": "Прибытие", "hi": "आगमन",
    },
    "stepPreLoading": {
        "en": "Pre-loading Inspection", "nl": "Voorinspectie", "fr": "Inspection pré-chargement",
        "de": "Vorlade-Inspektion", "es": "Inspección previa", "pl": "Inspekcja przedzaładunkiem",
        "tr": "Yükleme Öncesi Kontrol", "ar": "فحص قبل التحميل", "ro": "Inspecție pre-încărcare",
        "pt": "Inspeção pré-carregamento", "it": "Ispezione pre-carico", "cs": "Kontrola před nakládkou",
        "uk": "Переднавантажувальна перевірка", "zh": "装货前检查", "ru": "Предпогрузочный осмотр", "hi": "प्री-लोडिंग निरीक्षण",
    },
    "stepLoading": {
        "en": "Loading", "nl": "Laden", "fr": "Chargement",
        "de": "Beladung", "es": "Carga", "pl": "Załadunek",
        "tr": "Yükleme", "ar": "التحميل", "ro": "Încărcare",
        "pt": "Carregamento", "it": "Carico", "cs": "Nakládka",
        "uk": "Завантаження", "zh": "装货", "ru": "Погрузка", "hi": "लोडिंग",
    },
    "stepSecuring": {
        "en": "Securing", "nl": "Zekeren", "fr": "Arrimage",
        "de": "Sicherung", "es": "Aseguramiento", "pl": "Zabezpieczenie",
        "tr": "Sabitlendirme", "ar": "التأمين", "ro": "Securizare",
        "pt": "Fixação", "it": "Fissaggio", "cs": "Zajištění",
        "uk": "Кріплення", "zh": "固定", "ru": "Крепление", "hi": "सुरक्षित करना",
    },
    "stepPostLoading": {
        "en": "Post-loading", "nl": "Na laden", "fr": "Post-chargement",
        "de": "Nach dem Laden", "es": "Post-carga", "pl": "Po załadunku",
        "tr": "Yükleme Sonrası", "ar": "بعد التحميل", "ro": "Post-încărcare",
        "pt": "Pós-carregamento", "it": "Post-carico", "cs": "Po nakládce",
        "uk": "Після навантаження", "zh": "装货后", "ru": "После погрузки", "hi": "लोडिंग के बाद",
    },
    "stepComplete": {
        "en": "Complete", "nl": "Voltooid", "fr": "Terminé",
        "de": "Abgeschlossen", "es": "Completado", "pl": "Ukończone",
        "tr": "Tamamlandı", "ar": "مكتمل", "ro": "Finalizat",
        "pt": "Concluído", "it": "Completato", "cs": "Dokončeno",
        "uk": "Завершено", "zh": "完成", "ru": "Завершено", "hi": "पूर्ण",
    },
    "confirmArrival": {
        "en": "Confirm Arrival", "nl": "Aankomst bevestigen", "fr": "Confirmer l'arrivée",
        "de": "Ankunft bestätigen", "es": "Confirmar llegada", "pl": "Potwierdź przyjazd",
        "tr": "Varışı Onayla", "ar": "تأكيد الوصول", "ro": "Confirmă sosirea",
        "pt": "Confirmar chegada", "it": "Conferma arrivo", "cs": "Potvrdit příjezd",
        "uk": "Підтвердити прибуття", "zh": "确认到达", "ru": "Подтвердить прибытие", "hi": "आगमन की पुष्टि करें",
    },
    "loadAreaInspected": {
        "en": "Load area inspected and clean", "nl": "Laadruimte geïnspecteerd en schoon", "fr": "Zone de chargement inspectée et propre",
        "de": "Ladebereich inspiziert und sauber", "es": "Área de carga inspeccionada y limpia", "pl": "Obszar załadunku sprawdzony i czysty",
        "tr": "Yükleme alanı kontrol edildi ve temiz", "ar": "تم فحص منطقة التحميل ونظيفة", "ro": "Zona de încărcare inspectată și curată",
        "pt": "Área de carga inspecionada e limpa", "it": "Area di carico ispezionata e pulita", "cs": "Nakládací prostor zkontrolován a čistý",
        "uk": "Зона навантаження перевірена та чиста", "zh": "装载区域已检查并清洁", "ru": "Зона погрузки проверена и чиста", "hi": "लोड क्षेत्र निरीक्षित और साफ",
    },
    "photoBeforeLoading": {
        "en": "Photo BEFORE loading", "nl": "Foto VÓÓR laden", "fr": "Photo AVANT chargement",
        "de": "Foto VOR dem Laden", "es": "Foto ANTES de la carga", "pl": "Zdjęcie PRZED załadunkiem",
        "tr": "Yükleme ÖNCESİ fotoğraf", "ar": "صورة قبل التحميل", "ro": "Foto ÎNAINTE de încărcare",
        "pt": "Foto ANTES do carregamento", "it": "Foto PRIMA del carico", "cs": "Foto PŘED nakládkou",
        "uk": "Фото ДО навантаження", "zh": "装货前拍照", "ru": "Фото ДО погрузки", "hi": "लोडिंग से पहले फोटो",
    },
    "confirmItemsLoaded": {
        "en": "Confirm items loaded", "nl": "Bevestig geladen items", "fr": "Confirmer les articles chargés",
        "de": "Geladene Artikel bestätigen", "es": "Confirmar artículos cargados", "pl": "Potwierdź załadowane pozycje",
        "tr": "Yüklenen öğeleri onayla", "ar": "تأكيد العناصر المحملة", "ro": "Confirmă articolele încărcate",
        "pt": "Confirmar itens carregados", "it": "Conferma articoli caricati", "cs": "Potvrdit načtené položky",
        "uk": "Підтвердити завантажені позиції", "zh": "确认已装载物品", "ru": "Подтвердить загруженные позиции", "hi": "लोड की गई वस्तुओं की पुष्टि करें",
    },
    "loadSecuredStraps": {
        "en": "Load secured with straps", "nl": "Lading gezekerd met spanbanden", "fr": "Charge arrimée avec sangles",
        "de": "Ladung mit Gurten gesichert", "es": "Carga asegurada con correas", "pl": "Ładunek zabezpieczony pasami",
        "tr": "Yük bağı kayışlarıyla sabitlendi", "ar": "تم تأمين الحميل بأحزمة", "ro": "Marfă securizată cu curele",
        "pt": "Carga fixada com cintas", "it": "Carico fissato con cinghie", "cs": "Náklad zajištěn popruhy",
        "uk": "Вантаж закріплено ременями", "zh": "货物已用绑带固定", "ru": "Груз закреплён ремнями", "hi": "भार पट्टियों से सुरक्षित",
    },
    "photoDuringLoading": {
        "en": "Photo DURING loading", "nl": "Foto TIJDENS laden", "fr": "Photo PENDANT le chargement",
        "de": "Foto WÄHREND des Ladens", "es": "Foto DURANTE la carga", "pl": "Zdjęcie PODCZAS załadunku",
        "tr": "Yükleme SIRASINDA fotoğraf", "ar": "صورة أثناء التحميل", "ro": "Foto ÎN TIMPUL încărcării",
        "pt": "Foto DURANTE o carregamento", "it": "Foto DURANTE il carico", "cs": "Foto BĚHEM nakládky",
        "uk": "Фото ПІД ЧАС навантаження", "zh": "装货中拍照", "ru": "Фото ВО ВРЕМЯ погрузки", "hi": "लोडिंग के दौरान फोटो",
    },
    "photoAfterLoading": {
        "en": "Photo AFTER loading", "nl": "Foto NA laden", "fr": "Photo APRÈS le chargement",
        "de": "Foto NACH dem Laden", "es": "Foto DESPUÉS de la carga", "pl": "Zdjęcie PO załadunku",
        "tr": "Yükleme SONRASI fotoğraf", "ar": "صورة بعد التحميل", "ro": "Foto DUPĂ încărcare",
        "pt": "Foto DEPOIS do carregamento", "it": "Foto DOPO il carico", "cs": "Foto PO nakládce",
        "uk": "Фото ПІСЛЯ навантаження", "zh": "装货后拍照", "ru": "Фото ПОСЛЕ погрузки", "hi": "लोडिंग के बाद फोटो",
    },
    "finalConfirmation": {
        "en": "Final Confirmation", "nl": "Eindbevestiging", "fr": "Confirmation finale",
        "de": "Endbestätigung", "es": "Confirmación final", "pl": "Końcowe potwierdzenie",
        "tr": "Son Onay", "ar": "التأكيد النهائي", "ro": "Confirmare finală",
        "pt": "Confirmação final", "it": "Conferma finale", "cs": "Konečné potvrzení",
        "uk": "Остаточне підтвердження", "zh": "最终确认", "ru": "Окончательное подтверждение", "hi": "अंतिम पुष्टि",
    },
    "loadingSummary": {
        "en": "Loading Summary", "nl": "Laadoverzicht", "fr": "Résumé du chargement",
        "de": "Ladezusammenfassung", "es": "Resumen de carga", "pl": "Podsumowanie załadunku",
        "tr": "Yükleme Özeti", "ar": "ملخص التحميل", "ro": "Rezumat încărcare",
        "pt": "Resumo do carregamento", "it": "Riepilogo carico", "cs": "Souhrn nakládky",
        "uk": "Підсумок завантаження", "zh": "装货摘要", "ru": "Итог погрузки", "hi": "लोडिंग सारांश",
    },
    "next": {
        "en": "Next", "nl": "Volgende", "fr": "Suivant",
        "de": "Weiter", "es": "Siguiente", "pl": "Dalej",
        "tr": "İleri", "ar": "التالي", "ro": "Următorul",
        "pt": "Próximo", "it": "Avanti", "cs": "Další",
        "uk": "Далі", "zh": "下一步", "ru": "Далее", "hi": "अगला",
    },
    "back": {
        "en": "Back", "nl": "Terug", "fr": "Retour",
        "de": "Zurück", "es": "Atrás", "pl": "Wstecz",
        "tr": "Geri", "ar": "رجوع", "ro": "Înapoi",
        "pt": "Voltar", "it": "Indietro", "cs": "Zpět",
        "uk": "Назад", "zh": "返回", "ru": "Назад", "hi": "वापस",
    },
    "arrivalConfirmed": {
        "en": "Arrival confirmed", "nl": "Aankomst bevestigd", "fr": "Arrivée confirmée",
        "de": "Ankunft bestätigt", "es": "Llegada confirmada", "pl": "Przyjazd potwierdzony",
        "tr": "Varış onaylandı", "ar": "تم تأكيد الوصول", "ro": "Sosire confirmată",
        "pt": "Chegada confirmada", "it": "Arrivo confermato", "cs": "Příjezd potvrzen",
        "uk": "Прибуття підтверджено", "zh": "已确认到达", "ru": "Прибытие подтверждено", "hi": "आगमन की पुष्टि हुई",
    },
    "inspectionComplete": {
        "en": "Inspection complete", "nl": "Inspectie voltooid", "fr": "Inspection terminée",
        "de": "Inspektion abgeschlossen", "es": "Inspección completada", "pl": "Inspekcja zakończona",
        "tr": "Kontrol tamamlandı", "ar": "اكتمل الفحص", "ro": "Inspecție completată",
        "pt": "Inspeção concluída", "it": "Ispezione completata", "cs": "Kontrola dokončena",
        "uk": "Перевірку завершено", "zh": "检查完成", "ru": "Осмотр завершён", "hi": "निरीक्षण पूर्ण",
    },
    "loadingComplete": {
        "en": "Loading complete", "nl": "Laden voltooid", "fr": "Chargement terminé",
        "de": "Beladung abgeschlossen", "es": "Carga completada", "pl": "Załadunek zakończony",
        "tr": "Yükleme tamamlandı", "ar": "اكتمل التحميل", "ro": "Încărcare completată",
        "pt": "Carregamento concluído", "it": "Carico completato", "cs": "Nakládka dokončena",
        "uk": "Навантаження завершено", "zh": "装货完成", "ru": "Погрузка завершена", "hi": "लोडिंग पूर्ण",
    },
    "loadSecured": {
        "en": "Load secured", "nl": "Lading gezekerd", "fr": "Charge arrimée",
        "de": "Ladung gesichert", "es": "Carga asegurada", "pl": "Ładunek zabezpieczony",
        "tr": "Yük sabitlendi", "ar": "تم تأمين الحمولة", "ro": "Marfă securizată",
        "pt": "Carga fixada", "it": "Carico fissato", "cs": "Náklad zajištěn",
        "uk": "Вантаж закріплено", "zh": "货物已固定", "ru": "Груз закреплён", "hi": "भार सुरक्षित",
    },
    "postLoadingComplete": {
        "en": "Post-loading complete", "nl": "Na laden voltooid", "fr": "Post-chargement terminé",
        "de": "Nach dem Laden abgeschlossen", "es": "Post-carga completada", "pl": "Po załadunku zakończone",
        "tr": "Yükleme sonrası tamamlandı", "ar": "اكتمل ما بعد التحميل", "ro": "Post-încărcare completată",
        "pt": "Pós-carregamento concluído", "it": "Post-carico completato", "cs": "Po nakládce dokončeno",
        "uk": "Після навантаження завершено", "zh": "装货后流程完成", "ru": "После погрузки завершено", "hi": "पोस्ट-लोडिंग पूर्ण",
    },
    "processComplete": {
        "en": "Process complete", "nl": "Proces voltooid", "fr": "Processus terminé",
        "de": "Vorgang abgeschlossen", "es": "Proceso completado", "pl": "Proces zakończony",
        "tr": "Süreç tamamlandı", "ar": "اكتملت العملية", "ro": "Proces finalizat",
        "pt": "Processo concluído", "it": "Processo completato", "cs": "Proces dokončen",
        "uk": "Процес завершено", "zh": "流程完成", "ru": "Процесс завершён", "hi": "प्रक्रिया पूर्ण",
    },
    "page": {
        "en": "Page", "nl": "Pagina", "fr": "Page",
        "de": "Seite", "es": "Página", "pl": "Strona",
        "tr": "Sayfa", "ar": "صفحة", "ro": "Pagina",
        "pt": "Página", "it": "Pagina", "cs": "Stránka",
        "uk": "Сторінка", "zh": "页", "ru": "Страница", "hi": "पृष्ठ",
    },
    "companyInfo": {
        "en": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 Antwerpen",
        "nl": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 Antwerpen",
        "fr": "C. Steinweg Belgium N.V. — Quai des Glaces 125-133, 2000 Anvers",
        "de": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 Antwerpen",
        "es": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 Amberes",
        "pl": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 Antwerpia",
        "tr": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 Antwerp",
        "ar": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 أنتويرب",
        "ro": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 Antwerpen",
        "pt": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 Antuérpia",
        "it": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 Anversa",
        "cs": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 Antverpy",
        "uk": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 Антверпен",
        "zh": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 安特卫普",
        "ru": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 Антверпен",
        "hi": "C. Steinweg Belgium N.V. — Vrieskaai 125-133, 2000 एंटवर्प",
    },
    "barcode": {
        "en": "Barcode", "nl": "Barcode", "fr": "Code-barres",
        "de": "Barcode", "es": "Código de barras", "pl": "Kod kreskowy",
        "tr": "Barkod", "ar": "باركود", "ro": "Cod de bare",
        "pt": "Código de barras", "it": "Codice a barre", "cs": "Čárový kód",
        "uk": "Штрихкод", "zh": "条形码", "ru": "Штрихкод", "hi": "बारकोड",
    },
    "signatureLine": {
        "en": "Signature", "nl": "Handtekening", "fr": "Signature",
        "de": "Unterschrift", "es": "Firma", "pl": "Podpis",
        "tr": "İmza", "ar": "التوقيع", "ro": "Semnătură",
        "pt": "Assinatura", "it": "Firma", "cs": "Podpis",
        "uk": "Підпис", "zh": "签名", "ru": "Подпись", "hi": "हस्ताक्षर",
    },
    "dateLine": {
        "en": "Date", "nl": "Datum", "fr": "Date",
        "de": "Datum", "es": "Fecha", "pl": "Data",
        "tr": "Tarih", "ar": "التاريخ", "ro": "Data",
        "pt": "Data", "it": "Data", "cs": "Datum",
        "uk": "Дата", "zh": "日期", "ru": "Дата", "hi": "तिथि",
    },
}

LANGUAGES = ["en", "nl", "fr", "de", "es", "pl", "tr", "ar", "ro", "pt", "it", "cs", "uk", "zh", "ru", "hi"]

# Read the current file
with open('/home/z/my-project/src/lib/i18n.ts', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# For each non-English language, find the end of its translation block and add new keys
for lang in LANGUAGES[1:]:  # Skip English
    # Find the closing of this language's block: "  }," after the language section
    # We need to find the pattern: the last key-value pair before "  },"
    # Strategy: find "  LANG: {" and then the closing "  },"
    
    # Build the new key lines
    new_lines = []
    for key in NEW_KEYS:
        val = NEW_KEYS[key].get(lang, NEW_KEYS[key]['en'])
        val_escaped = val.replace("\\", "\\\\").replace("'", "\\'")
        new_lines.append(f"    {key}: '{val_escaped}',")
    
    new_block = "\n".join(new_lines)
    
    # Find the language section - we need to insert before the closing "  },"
    # Pattern: after the last key in the language block, before "  },"
    lang_pattern = f"  {lang}: {{"
    lang_start = content.find(lang_pattern)
    if lang_start == -1:
        print(f"WARNING: Could not find {lang} section")
        continue
    
    # Find the closing "  }," after this section
    # We look for the next language section or the end
    close_pattern = "  },"
    search_start = lang_start + len(lang_pattern)
    
    # Find the "  }," that closes this language block
    close_pos = content.find(close_pattern, search_start)
    if close_pos == -1:
        print(f"WARNING: Could not find closing for {lang}")
        continue
    
    # Insert new keys before the closing "  },"
    insert_text = new_block + "\n"
    content = content[:close_pos] + insert_text + content[close_pos:]
    
    print(f"Added {len(NEW_KEYS)} keys to {lang}")

# Write back
with open('/home/z/my-project/src/lib/i18n.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! All languages updated.")
