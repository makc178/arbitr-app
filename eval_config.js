window.EVAL_CONFIG={
 "title": "Оценка",
 "doc_title": "Аналитическая справка о рыночной стоимости",
 "intro": "Запрос Оценщику. Результат: аналитическая справка (PDF с графиками), расчётная таблица (XLSX) и «Описание методики расчёта».",
 "disclaimer": "Справка носит информационный характер и не является отчётом об оценке в смысле Федерального закона № 135-ФЗ „Об оценочной деятельности в РФ“",
 "required_mark": "*",
 "max_file_mb": 20,
 "accept": ".pdf,.jpg,.jpeg,.png,.heic,.xlsx,.xls,.docx,.doc,.xml,.txt,.csv,.zip",
 "card_files": [
  {
   "key": "report",
   "label": "PDF",
   "name": "справка.pdf"
  },
  {
   "key": "xlsx",
   "label": "XLSX",
   "name": "расчёт.xlsx"
  },
  {
   "key": "methodology",
   "label": "Методика",
   "name": "Описание методики расчёта.pdf",
   "required": true,
   "missing_warning": "⚠ Не приложено «Описание методики расчёта» — запросите у Оценщика"
  }
 ],
 "purpose_warnings": {
  "court": "Для этой цели по закону нужен отчёт оценщика, состоящего в СРО (ст. 130 закона о банкротстве, ст. 85 закона об исполнительном производстве). Справка подходит только для предварительной оценки",
  "pledge": "Для этой цели по закону нужен отчёт оценщика, состоящего в СРО (ст. 130 закона о банкротстве, ст. 85 закона об исполнительном производстве). Справка подходит только для предварительной оценки",
  "bankruptcy": "Для этой цели по закону нужен отчёт оценщика, состоящего в СРО (ст. 130 закона о банкротстве, ст. 85 закона об исполнительном производстве). Справка подходит только для предварительной оценки",
  "auction": "Для этой цели по закону нужен отчёт оценщика, состоящего в СРО (ст. 130 закона о банкротстве, ст. 85 закона об исполнительном производстве). Справка подходит только для предварительной оценки"
 },
 "common": [
  {
   "k": "purpose",
   "label": "Цель оценки",
   "type": "select",
   "req": true,
   "options": {
    "deal": "Сделка",
    "court": "Суд",
    "pledge": "Залог",
    "bankruptcy": "Банкротство",
    "auction": "Торги",
    "self": "Для себя"
   }
  },
  {
   "k": "value_type",
   "label": "Вид стоимости",
   "type": "select",
   "req": true,
   "options": {
    "market": "Рыночная",
    "liquidation": "Ликвидационная",
    "investment": "Инвестиционная"
   }
  },
  {
   "k": "valuation_date",
   "label": "Дата оценки",
   "type": "date",
   "req": true
  },
  {
   "k": "value_wish",
   "label": "Пожелание по стоимости",
   "type": "segment",
   "req": true,
   "options": {
    "high": "Высокая",
    "realistic": "Реалистичная",
    "conservative": "Консервативная",
    "low": "Низкая"
   },
   "default": "realistic"
  },
  {
   "k": "files",
   "label": "Вложения",
   "type": "file"
  },
  {
   "k": "comment",
   "label": "Комментарий",
   "type": "textarea"
  }
 ],
 "types": {
  "realty": {
   "label": "Недвижимость",
   "attach_hint": "ЕГРН, техпаспорт, фото",
   "title_keys": [
    "kind",
    "address"
   ],
   "fields": [
    {
     "k": "kind",
     "label": "Вид",
     "type": "select",
     "req": true,
     "options": {
      "flat": "Квартира",
      "house": "Жилой дом",
      "nonres": "Нежилое помещение",
      "building": "Здание",
      "land": "Земельный участок",
      "enk": "ЕНК"
     }
    },
    {
     "k": "address",
     "label": "Адрес",
     "type": "text",
     "req": true
    },
    {
     "k": "cadastral",
     "label": "Кадастровый номер",
     "type": "text",
     "req": true
    },
    {
     "k": "area",
     "label": "Площадь, м²",
     "type": "number",
     "req": true
    },
    {
     "k": "land_category",
     "label": "Категория земель",
     "type": "text",
     "show_if": {
      "kind": "land"
     }
    },
    {
     "k": "vri",
     "label": "ВРИ",
     "type": "text",
     "show_if": {
      "kind": "land"
     }
    },
    {
     "k": "floor",
     "label": "Этаж / этажность",
     "type": "text"
    },
    {
     "k": "built",
     "label": "Год постройки",
     "type": "number"
    },
    {
     "k": "walls",
     "label": "Материал стен",
     "type": "text"
    },
    {
     "k": "condition",
     "label": "Состояние / отделка",
     "type": "select",
     "options": {
      "none": "Без отделки",
      "repair": "Требует ремонта",
      "good": "Хорошее",
      "excellent": "Отличное"
     }
    },
    {
     "k": "right",
     "label": "Право",
     "type": "select",
     "options": {
      "own": "Собственность",
      "lease": "Аренда",
      "share": "Долевая"
     }
    },
    {
     "k": "share",
     "label": "Доля",
     "type": "text",
     "show_if": {
      "right": "share"
     }
    },
    {
     "k": "encumbrances",
     "label": "Обременения",
     "type": "multi",
     "options": {
      "none": "Нет",
      "mortgage": "Ипотека",
      "lease": "Аренда",
      "arrest": "Арест"
     },
     "exclusive": "none"
    },
    {
     "k": "rented",
     "label": "Сдаётся в аренду",
     "type": "select",
     "options": {
      "no": "Нет",
      "yes": "Да"
     }
    },
    {
     "k": "rent",
     "label": "Аренда, ₽/мес",
     "type": "number",
     "show_if": {
      "rented": "yes"
     }
    }
   ],
   "upload_caption": "Загрузить ЕГРН, техпаспорт или фото"
  },
  "movable": {
   "label": "Движимое имущество",
   "attach_hint": "ПТС/ПСМ, СТС, фото, Автотека",
   "title_keys": [
    "make_model",
    "year"
   ],
   "fields": [
    {
     "k": "kind",
     "label": "Вид",
     "type": "select",
     "req": true,
     "options": {
      "car": "Легковой",
      "truck": "Грузовой",
      "special": "Спецтехника",
      "equipment": "Оборудование",
      "other": "Прочее"
     }
    },
    {
     "k": "make_model",
     "label": "Марка и модель",
     "type": "text",
     "req": true
    },
    {
     "k": "year",
     "label": "Год",
     "type": "number",
     "req": true
    },
    {
     "k": "vin",
     "label": "VIN / заводской номер",
     "type": "text"
    },
    {
     "k": "plate",
     "label": "Госномер",
     "type": "text"
    },
    {
     "k": "mileage",
     "label": "Пробег, км / моточасы",
     "type": "text"
    },
    {
     "k": "equipment",
     "label": "Комплектация / двигатель",
     "type": "text"
    },
    {
     "k": "condition",
     "label": "Состояние",
     "type": "select",
     "req": true,
     "options": {
      "excellent": "Отличное",
      "good": "Хорошее",
      "fair": "Удовл.",
      "repair": "Требует ремонта"
     }
    },
    {
     "k": "damage",
     "label": "ДТП / повреждения",
     "type": "textarea"
    },
    {
     "k": "owners",
     "label": "Число владельцев",
     "type": "number"
    },
    {
     "k": "location",
     "label": "Местонахождение",
     "type": "text"
    },
    {
     "k": "encumbrances",
     "label": "Обременения",
     "type": "multi",
     "options": {
      "none": "Нет",
      "pledge": "Залог",
      "arrest": "Арест"
     },
     "exclusive": "none"
    }
   ],
   "upload_caption": "Загрузить ПТС/ПСМ, СТС, фото или Автотеку"
  },
  "claims": {
   "label": "Права требования",
   "attach_hint": "Договор, акты сверки, судебные акты, выписка из реестра требований",
   "title_keys": [
    "debtor"
   ],
   "fields": [
    {
     "k": "debtor",
     "label": "Должник (наименование / ФИО)",
     "type": "text",
     "req": true
    },
    {
     "k": "debtor_inn",
     "label": "ИНН должника",
     "type": "inn",
     "req": true
    },
    {
     "k": "creditor",
     "label": "Кредитор",
     "type": "text"
    },
    {
     "k": "basis",
     "label": "Основание",
     "type": "select",
     "req": true,
     "options": {
      "contract": "Договор",
      "judgment": "Решение суда",
      "writ": "Исполнительный лист"
     }
    },
    {
     "k": "principal",
     "label": "Основной долг, ₽",
     "type": "number",
     "req": true
    },
    {
     "k": "interest",
     "label": "Проценты, ₽",
     "type": "number"
    },
    {
     "k": "penalty",
     "label": "Неустойка, ₽",
     "type": "number"
    },
    {
     "k": "arose",
     "label": "Дата возникновения",
     "type": "date"
    },
    {
     "k": "case_no",
     "label": "Судебный акт / номер дела",
     "type": "text"
    },
    {
     "k": "security",
     "label": "Обеспечение",
     "type": "multi",
     "options": {
      "none": "Нет",
      "pledge": "Залог",
      "surety": "Поручительство"
     },
     "exclusive": "none"
    },
    {
     "k": "security_desc",
     "label": "Описание обеспечения",
     "type": "textarea"
    },
    {
     "k": "debtor_status",
     "label": "Статус должника",
     "type": "select",
     "options": {
      "active": "Действует",
      "bankrupt": "Банкротство",
      "liquidated": "Ликвидирован"
     }
    },
    {
     "k": "bk_case",
     "label": "Номер дела о банкротстве",
     "type": "text",
     "show_if": {
      "debtor_status": "bankrupt"
     }
    },
    {
     "k": "bk_order",
     "label": "Очерёдность",
     "type": "text",
     "show_if": {
      "debtor_status": "bankrupt"
     }
    },
    {
     "k": "ip",
     "label": "Исполнительное производство",
     "type": "select",
     "options": {
      "no": "Нет",
      "yes": "Да"
     }
    },
    {
     "k": "collected",
     "label": "Взыскано, ₽",
     "type": "number"
    }
   ],
   "upload_caption": "Загрузить договор, акты сверки, судебные акты или выписку из реестра"
  },
  "business": {
   "label": "Бизнес",
   "attach_hint": "Отчётность, ОСВ, расшифровки, устав",
   "title_keys": [
    "company"
   ],
   "fields": [
    {
     "k": "company",
     "label": "Компания",
     "type": "text",
     "req": true
    },
    {
     "k": "company_inn",
     "label": "ИНН",
     "type": "inn",
     "req": true
    },
    {
     "k": "object",
     "label": "Объект оценки",
     "type": "select",
     "req": true,
     "options": {
      "full": "100%",
      "share": "Доля, %",
      "shares": "Пакет акций"
     }
    },
    {
     "k": "share_pct",
     "label": "Доля / пакет, %",
     "type": "number",
     "show_if": {
      "object": [
       "share",
       "shares"
      ]
     }
    },
    {
     "k": "okved",
     "label": "Отрасль / ОКВЭД",
     "type": "text"
    },
    {
     "k": "statements",
     "label": "Бухотчётность за 3 года и промежуточная",
     "type": "file",
     "req": true
    },
    {
     "k": "revenue",
     "label": "Выручка, ₽",
     "type": "number"
    },
    {
     "k": "ebitda",
     "label": "EBITDA, ₽",
     "type": "number"
    },
    {
     "k": "net_profit",
     "label": "Чистая прибыль, ₽",
     "type": "number"
    },
    {
     "k": "assets",
     "label": "Ключевые активы",
     "type": "textarea"
    },
    {
     "k": "loans",
     "label": "Кредиты и займы",
     "type": "textarea"
    },
    {
     "k": "forecast",
     "label": "Прогноз / бизнес-план",
     "type": "textarea"
    },
    {
     "k": "restrictions",
     "label": "Корпоративные ограничения",
     "type": "textarea"
    }
   ],
   "upload_caption": "Загрузить отчётность, ОСВ, расшифровки или устав"
  },
  "by_document": {
   "label": "По документу",
   "mode": "by_document",
   "attach_hint": "Документы по объекту: PDF, JPG, PNG, DOCX, XLSX — Оценщик сам определит предмет оценки",
   "require_files": true,
   "require_files_msg": "Вложения (хотя бы один файл)",
   "accept": ".pdf,.jpg,.jpeg,.png,.docx,.xlsx",
   "title_keys": [],
   "fields": [
    {
     "k": "object_type",
     "label": "Тип объекта",
     "type": "select",
     "default": "auto",
     "options": {
      "auto": "Определить по документу",
      "realty": "Недвижимость",
      "movable": "Движимое имущество",
      "claims": "Права требования",
      "business": "Бизнес"
     }
    }
   ],
   "upload_caption": "Загрузить документы по объекту (PDF, JPG, PNG, DOCX, XLSX)"
  }
 },
 "statuses": {
  "pending": "в обработке",
  "need_data": "Нужны данные",
  "data_added": "данные дозагружены",
  "done": "готово"
 },
 "need_data": {
  "missing_title": "Оценщику не хватает:",
  "upload_label": "Дозагрузить файлы",
  "sent": "✓ Файлы дозагружены, Оценщик продолжит работу."
 },
 "upload_caption_default": "Загрузить файлы"
};
