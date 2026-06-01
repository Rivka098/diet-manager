import { useMemo, useRef, useState } from 'react';
import './App.css';

const STORAGE_KEYS = {
  dailyData: 'diet-manager-daily-data',
  weightRows: 'diet-manager-weight-rows',
  shoppingItems: 'diet-manager-shopping-items',
  bmiForm: 'diet-manager-bmi-form',
};

const PLAN_DEFINITIONS = {
  1000: [
    { key: 'carb', label: 'פחמימה', count: 4 },
    { key: 'proteinSmall', label: 'חלבון קטן', count: 3 },
    { key: 'proteinBig', label: 'חלבון גדול', count: 1 },
    { key: 'fruit', label: 'פרי', count: 2 },
    { key: 'fat', label: 'שומן', count: 3 },
  ],
  1200: [
    { key: 'carb', label: 'פחמימה', count: 5 },
    { key: 'proteinSmall', label: 'חלבון קטן', count: 4 },
    { key: 'proteinBig', label: 'חלבון גדול', count: 1 },
    { key: 'fruit', label: 'פרי', count: 3 },
    { key: 'fat', label: 'שומן', count: 3 },
  ],
};

const COMPLIMENTS = {
  gain: [
    'לא נורא, תמשיכי לנסות',
    'קורה, בעז"ה בשבוע הבא',
    'חשוב לנסות, אולי בשבוע הבא',
    'תאמיני בעצמך שזה יצליח',
  ],
  smallLoss: ['טוב!!', 'בהצלחה הלאה', 'טוב מאד!!', 'איזה יופי!'],
  mediumLoss: [
    'טוב מאד!!!',
    'מדהימה!!!',
    'כל הכבוד!!!',
    'מצויין!!',
    'אלופה!!!',
    'נהדרת!!!',
    'תמשיכי להצליח!!',
  ],
  bigLoss: ['פנטסטית!!!', 'וואו, איזה כיף, כל הכבוד!!!', 'עשית את זה, אלופה!!'],
};

const BMI_CATEGORIES = [
  {
    key: 'underweight',
    min: 0,
    max: 18.4,
    title: 'תת-משקל',
    description: 'המשקל נמוך מהטווח המומלץ ביחס לגובה.',
    colorClass: 'bmi-blue',
  },
  {
    key: 'normal',
    min: 18.5,
    max: 24.9,
    title: 'משקל תקין',
    description: 'המשקל נמצא בטווח המומלץ ביחס לגובה.',
    colorClass: 'bmi-green',
  },
  {
    key: 'overweight',
    min: 25,
    max: 29.9,
    title: 'עודף משקל',
    description:
      'המשקל גבוה מהטווח המומלץ וייתכן שכדאי לשקול התאמות בתזונה ובאורח החיים.',
    colorClass: 'bmi-orange',
  },
  {
    key: 'obesity-1',
    min: 30,
    max: 34.9,
    title: 'השמנה דרגה 1',
    description: 'המשקל גבוה משמעותית מהטווח המומלץ.',
    colorClass: 'bmi-red',
  },
  {
    key: 'obesity-2',
    min: 35,
    max: 39.9,
    title: 'השמנה דרגה 2',
    description: 'המשקל גבוה מאוד מהטווח המומלץ.',
    colorClass: 'bmi-red',
  },
  {
    key: 'obesity-3',
    min: 40,
    max: Number.POSITIVE_INFINITY,
    title: 'השמנה דרגה 3',
    description: 'המשקל גבוה בצורה קיצונית ביחס לטווח המומלץ.',
    colorClass: 'bmi-red',
  },
];

function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setAndStore = (nextValue) => {
    setState((previous) => {
      const resolved = typeof nextValue === 'function' ? nextValue(previous) : nextValue;
      localStorage.setItem(key, JSON.stringify(resolved));
      return resolved;
    });
  };

  return [state, setAndStore];
}

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createTicketItems(plan) {
  const planConfig = PLAN_DEFINITIONS[plan] || PLAN_DEFINITIONS[1000];

  return planConfig.flatMap((group) =>
    Array.from({ length: group.count }, (_, index) => ({
      id: `${group.key}-${index + 1}`,
      title: `${group.label} ${index + 1}`,
      checked: false,
      note: '',
      noteSaved: false,
    }))
  );
}

function createDayTicket(plan = 1000) {
  return {
    plan,
    items: createTicketItems(plan),
    vegetables: [],
  };
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getCompliment(changeKg) {
  if (changeKg < 0) {
    return randomFrom(COMPLIMENTS.gain);
  }

  if (changeKg === 0) {
    return 'התמדה זה כוח, ממשיכים הלאה';
  }

  if (changeKg <= 0.5) {
    return randomFrom(COMPLIMENTS.smallLoss);
  }

  if (changeKg <= 2) {
    return randomFrom(COMPLIMENTS.mediumLoss);
  }

  return randomFrom(COMPLIMENTS.bigLoss);
}

function formatChange(changeKg) {
  if (changeKg > 0) {
    return `ירידה של ${changeKg.toFixed(2)} ק"ג`;
  }

  if (changeKg < 0) {
    return `עלייה של ${Math.abs(changeKg).toFixed(2)} ק"ג`;
  }

  return 'ללא שינוי';
}

function getBmiCategory(bmiValue) {
  return (
    BMI_CATEGORIES.find((category) => bmiValue >= category.min && bmiValue <= category.max) ||
    BMI_CATEGORIES[0]
  );
}

function getBmiMarkerPercent(bmiValue) {
  const minScale = 10;
  const maxScale = 45;
  const clamped = Math.min(Math.max(bmiValue, minScale), maxScale);
  return ((clamped - minScale) / (maxScale - minScale)) * 100;
}

function App() {
  const [activePage, setActivePage] = useState('home');
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate());
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [foodNoteErrors, setFoodNoteErrors] = useState({});
  const [showFoodDetails, setShowFoodDetails] = useState(false);

  const [dailyData, setDailyData] = useLocalStorageState(STORAGE_KEYS.dailyData, {});
  const [weightRows, setWeightRows] = useLocalStorageState(STORAGE_KEYS.weightRows, []);
  const [shoppingItems, setShoppingItems] = useLocalStorageState(STORAGE_KEYS.shoppingItems, []);
  const [bmiForm, setBmiForm] = useLocalStorageState(STORAGE_KEYS.bmiForm, {
    weightKg: '',
    heightCm: '',
  });

  const [weightInput, setWeightInput] = useState('');
  const [weighingDateInput, setWeighingDateInput] = useState(getTodayIsoDate());
  const [productInput, setProductInput] = useState('');
  const [vegetableInput, setVegetableInput] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [bmiErrors, setBmiErrors] = useState({});
  const [bmiResult, setBmiResult] = useState(null);

  const shoppingPdfRef = useRef(null);

  const dayTicket = {
    ...(dailyData[selectedDate] || createDayTicket(1000)),
    vegetables: Array.isArray(dailyData[selectedDate]?.vegetables)
      ? dailyData[selectedDate].vegetables
      : [],
  };
  const eatenCount = dayTicket.items.filter((item) => item.checked).length;

  const eatenWithDetails = useMemo(
    () => dayTicket.items.filter((item) => item.checked),
    [dayTicket.items]
  );

  const healthyWeightRange = useMemo(() => {
    const heightNumber = Number(bmiForm.heightCm);

    if (!heightNumber || heightNumber <= 0) {
      return null;
    }

    const heightMeters = heightNumber / 100;
    return {
      min: Number((18.5 * heightMeters * heightMeters).toFixed(1)),
      max: Number((24.9 * heightMeters * heightMeters).toFixed(1)),
    };
  }, [bmiForm.heightCm]);

  const updateDayTicket = (date, updater) => {
    setDailyData((prev) => {
      const base = prev[date] || createDayTicket(1000);
      const normalizedBase = {
        ...base,
        vegetables: Array.isArray(base.vegetables) ? base.vegetables : [],
      };

      return {
        ...prev,
        [date]: updater(normalizedBase),
      };
    });
  };

  const handlePlanChange = (event) => {
    const nextPlan = Number(event.target.value);
    updateDayTicket(selectedDate, (ticket) => ({
      ...createDayTicket(nextPlan),
      vegetables: ticket.vegetables,
    }));
    setEditingFoodId(null);
    setShowFoodDetails(false);
  };

  const addVegetable = (event) => {
    event.preventDefault();
    const vegetableName = vegetableInput.trim();

    if (!vegetableName) {
      return;
    }

    updateDayTicket(selectedDate, (ticket) => ({
      ...ticket,
      vegetables: [...ticket.vegetables, { id: crypto.randomUUID(), name: vegetableName }],
    }));
    setVegetableInput('');
  };

  const toggleFoodItem = (itemId, nextChecked) => {
    updateDayTicket(selectedDate, (ticket) => ({
      ...ticket,
      items: ticket.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,
          checked: nextChecked,
          note: nextChecked ? item.note : '',
          noteSaved: nextChecked ? item.noteSaved || false : false,
        };
      }),
    }));

    if (nextChecked) {
      setEditingFoodId(itemId);
      setFoodNoteErrors((prev) => ({ ...prev, [itemId]: '' }));
    } else if (editingFoodId === itemId) {
      setEditingFoodId(null);
      setFoodNoteErrors((prev) => ({ ...prev, [itemId]: '' }));
    }
  };

  const updateFoodNote = (itemId, note) => {
    updateDayTicket(selectedDate, (ticket) => ({
      ...ticket,
      items: ticket.items.map((item) => (item.id === itemId ? { ...item, note } : item)),
    }));

    setFoodNoteErrors((prev) => ({ ...prev, [itemId]: '' }));
  };

  const saveFoodNote = (itemId) => {
    const selectedItem = dayTicket.items.find((item) => item.id === itemId);
    const normalizedNote = selectedItem?.note?.trim() || '';

    if (!normalizedNote) {
      setFoodNoteErrors((prev) => ({ ...prev, [itemId]: 'יש לכתוב מה נאכל לפני שמירה.' }));
      return;
    }

    updateDayTicket(selectedDate, (ticket) => ({
      ...ticket,
      items: ticket.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,
          note: normalizedNote,
          noteSaved: true,
        };
      }),
    }));

    setFoodNoteErrors((prev) => ({ ...prev, [itemId]: '' }));
    setEditingFoodId(null);
  };

  const addWeightRow = (event) => {
    event.preventDefault();
    const weight = Number(weightInput);

    if (!weight || !weighingDateInput) {
      return;
    }

    const previous = weightRows[weightRows.length - 1];
    const changeKg = previous ? previous.weight - weight : 0;

    const newRow = {
      id: crypto.randomUUID(),
      date: weighingDateInput,
      weight,
      changeText: previous ? formatChange(changeKg) : 'שקילה ראשונה',
      compliment: previous ? getCompliment(changeKg) : 'התחלה מעולה, בהצלחה!',
    };

    setWeightRows((prev) => [...prev, newRow]);
    setWeightInput('');
    setWeighingDateInput(getTodayIsoDate());
  };

  const addShoppingItem = (event) => {
    event.preventDefault();
    const name = productInput.trim();

    if (!name) {
      return;
    }

    setShoppingItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, checked: false },
    ]);
    setProductInput('');
  };

  const toggleShoppingItem = (itemId) => {
    setShoppingItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item))
    );
  };

  const removeShoppingItem = (itemId) => {
    setShoppingItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const removeWeightRow = (rowId) => {
    setWeightRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const downloadShoppingPdf = async () => {
    if (!shoppingItems.length || !shoppingPdfRef.current) {
      return;
    }

    setIsPdfLoading(true);

    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const canvas = await html2canvas(shoppingPdfRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imageWidth = pageWidth - margin * 2;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      const printableHeight = pageHeight - margin * 2;

      let remainingHeight = imageHeight;
      let yPosition = margin;

      pdf.addImage(imageData, 'PNG', margin, yPosition, imageWidth, imageHeight);
      remainingHeight -= printableHeight;

      while (remainingHeight > 0) {
        pdf.addPage();
        yPosition = margin - (imageHeight - remainingHeight);
        pdf.addImage(imageData, 'PNG', margin, yPosition, imageWidth, imageHeight);
        remainingHeight -= printableHeight;
      }

      pdf.save('diet-shopping-list.pdf');
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleBmiFieldChange = (field, value) => {
    setBmiForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setBmiErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const calculateBmi = (event) => {
    event.preventDefault();

    const errors = {};
    const weightKg = Number(bmiForm.weightKg);
    const heightCm = Number(bmiForm.heightCm);

    if (!bmiForm.weightKg) {
      errors.weightKg = 'יש להזין משקל בקילוגרמים.';
    } else if (Number.isNaN(weightKg) || weightKg <= 0) {
      errors.weightKg = 'המשקל חייב להיות מספר גדול מאפס.';
    }

    if (!bmiForm.heightCm) {
      errors.heightCm = 'יש להזין גובה בסנטימטרים.';
    } else if (Number.isNaN(heightCm) || heightCm <= 0) {
      errors.heightCm = 'הגובה חייב להיות מספר גדול מאפס.';
    }

    if (Object.keys(errors).length > 0) {
      setBmiErrors(errors);
      setBmiResult(null);
      return;
    }

    const heightMeters = heightCm / 100;
    const rawBmi = weightKg / (heightMeters * heightMeters);
    const bmiValue = Number(rawBmi.toFixed(1));
    const category = getBmiCategory(bmiValue);
    const healthyMin = Number((18.5 * heightMeters * heightMeters).toFixed(1));
    const healthyMax = Number((24.9 * heightMeters * heightMeters).toFixed(1));

    setBmiResult({
      bmiValue,
      category,
      healthyMin,
      healthyMax,
      markerPercent: getBmiMarkerPercent(bmiValue),
      message:
        category.key === 'normal'
          ? 'מעולה! את בטווח התקין, המשיכי כך.'
          : 'התוצאה מחוץ לטווח התקין. מומלץ להמשיך מעקב ולפעול בהדרגה ובאיזון.',
    });
  };

  const pages = [
    { id: 'home', label: 'דף הבית' },
    { id: 'daily', label: 'ניהול אכילה יומית' },
    { id: 'weight', label: 'מעקב שקילה' },
    { id: 'shopping', label: 'רשימת קניות' },
    { id: 'bmi', label: 'מחשבון BMI' },
  ];

  return (
    <div className="app" dir="rtl">
      <div className="app-shell">
        <header className="top-card">
          <h1>ניהול הדיאטה שלי</h1>
          <p>אפליקציה אישית לניהול אכילה, שקילות וקניות בצורה נעימה ופשוטה.</p>
        </header>

        <nav className="tabs" aria-label="ניווט ראשי">
          {pages.map((page) => (
            <button
              key={page.id}
              className={`tab-btn ${activePage === page.id ? 'active' : ''}`}
              onClick={() => setActivePage(page.id)}
            >
              {page.label}
            </button>
          ))}
        </nav>

        {activePage === 'home' && (
          <section className="card">
            <h2>ברוכה הבאה</h2>
            <div className="home-grid">
              <article className="metric-box">
                <h3>היום</h3>
                <p>
                  סומנו {eatenCount} מתוך {dayTicket.items.length} מנות בתאריך {selectedDate}
                </p>
              </article>
              <article className="metric-box">
                <h3>שקילות</h3>
                <p>נרשמו {weightRows.length} שקילות עד כה</p>
              </article>
              <article className="metric-box">
                <h3>רשימת קניות</h3>
                <p>יש {shoppingItems.length} מוצרים ברשימה</p>
              </article>
            </div>
          </section>
        )}

        {activePage === 'daily' && (
          <section className="card">
            <h2>ניהול אכילה יומית</h2>

            <div className="daily-controls">
              <label>
                תאריך
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setEditingFoodId(null);
                    setShowFoodDetails(false);
                  }}
                />
              </label>

              <label>
                תוכנית קלוריות
                <select value={dayTicket.plan} onChange={handlePlanChange}>
                  <option value={1000}>1000 קלוריות</option>
                  <option value={1200}>1200 קלוריות</option>
                </select>
              </label>

              <div className="progress-chip">
                סומנו {eatenCount} מתוך {dayTicket.items.length}
              </div>
            </div>

            <div className="ticket-grid">
              {dayTicket.items.map((item) => (
                <article key={item.id} className={`ticket-item ${item.checked ? 'done' : ''}`}>
                  <label className="ticket-main">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(event) => toggleFoodItem(item.id, event.target.checked)}
                    />
                    <span>{item.title}</span>
                  </label>

                  {item.checked && !item.noteSaved && editingFoodId !== item.id && (
                    <button
                      type="button"
                      className="inline-btn"
                      onClick={() => setEditingFoodId(item.id)}
                    >
                      כתבי מה נאכל
                    </button>
                  )}

                  {item.checked && editingFoodId === item.id && !item.noteSaved && (
                    <div className="food-note-block">
                      <textarea
                        className="food-note"
                        placeholder="למשל: יוגורט, סלט, 2 פרוסות לחם..."
                        value={item.note}
                        onChange={(event) => updateFoodNote(item.id, event.target.value)}
                      />
                      {foodNoteErrors[item.id] && (
                        <p className="input-error">{foodNoteErrors[item.id]}</p>
                      )}
                      <div className="note-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => saveFoodNote(item.id)}
                        >
                          שמירה
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>

            <form className="vegetable-form" onSubmit={addVegetable}>
              <label>
               ירקות חופשי
                <input
                  type="text"
                  value={vegetableInput}
                  onChange={(event) => setVegetableInput(event.target.value)}
                  placeholder="למשל: מלפפון, עגבנייה, חסה"
                />
              </label>
              <button type="submit">הוספת ירק</button>
            </form>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => setShowFoodDetails((prev) => !prev)}
            >
              {showFoodDetails ? 'הסתר רשימת אכילה יומית' : 'הצג מה נאכל היום'}
            </button>

            {showFoodDetails && (
              <div className="food-list">
                {eatenWithDetails.length === 0 && dayTicket.vegetables.length === 0 && (
                  <p>עדיין לא סומן שום פריט להיום.</p>
                )}

                {(eatenWithDetails.length > 0 || dayTicket.vegetables.length > 0) && (
                  <ul>
                    {eatenWithDetails.map((item) => (
                      <li key={`daily-note-${item.id}`}>
                        <strong>{item.title}:</strong> {item.note || 'סומן ללא פירוט'}
                      </li>
                    ))}

                    {dayTicket.vegetables.map((vegetable) => (
                      <li key={`daily-vegetable-${vegetable.id}`}>
                        <strong>ירקות חופשי:</strong> {vegetable.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        )}

        {activePage === 'weight' && (
          <section className="card">
            <h2>מעקב שקילה</h2>

            <form className="form-row" onSubmit={addWeightRow}>
              <label>
                תאריך שקילה
                <input
                  type="date"
                  value={weighingDateInput}
                  onChange={(event) => setWeighingDateInput(event.target.value)}
                  required
                />
              </label>

              <label>
                משקל (ק"ג)
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={weightInput}
                  onChange={(event) => setWeightInput(event.target.value)}
                  required
                />
              </label>

              <button type="submit">הוספת שקילה</button>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>תאריך שקילה</th>
                    <th>משקל</th>
                    <th>ירידה/עלייה משקילה קודמת</th>
                    <th>מחמאה</th>
                    <th>מחיקה</th>
                  </tr>
                </thead>
                <tbody>
                  {weightRows.length === 0 && (
                    <tr>
                      <td colSpan="5">עדיין אין נתוני שקילה.</td>
                    </tr>
                  )}

                  {weightRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.date}</td>
                      <td>{row.weight}</td>
                      <td>{row.changeText}</td>
                      <td>{row.compliment}</td>
                      <td>
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => removeWeightRow(row.id)}
                        >
                          מחיקה
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activePage === 'shopping' && (
          <section className="card">
            <h2>רשימת קניות לדיאטה</h2>

            <form className="form-row" onSubmit={addShoppingItem}>
              <label>
                מוצר חדש
                <input
                  type="text"
                  value={productInput}
                  onChange={(event) => setProductInput(event.target.value)}
                  placeholder="למשל: טונה במים"
                  required
                />
              </label>
              <button type="submit">הוספה לרשימה</button>
            </form>

            <button
              type="button"
              className="secondary-btn"
              onClick={downloadShoppingPdf}
              disabled={shoppingItems.length === 0 || isPdfLoading}
            >
              {isPdfLoading ? 'מכין PDF...' : 'הורדת רשימת קניות כ-PDF'}
            </button>

            <div className="pdf-capture" ref={shoppingPdfRef}>
              <h3>רשימת קניות לדיאטה</h3>
              <p>תאריך יצוא: {new Date().toLocaleDateString('he-IL')}</p>
              <ul>
                {shoppingItems.length === 0 && <li>הרשימה ריקה</li>}
                {shoppingItems.map((item, index) => (
                  <li key={`pdf-${item.id}`}>
                    {index + 1}. {item.name} {item.checked ? '(סומן)' : ''}
                  </li>
                ))}
              </ul>
            </div>

            <ul className="shopping-list">
              {shoppingItems.length === 0 && <li>הרשימה עדיין ריקה.</li>}

              {shoppingItems.map((item) => (
                <li key={item.id} className={item.checked ? 'checked' : ''}>
                  <label>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleShoppingItem(item.id)}
                    />
                    <span>{item.name}</span>
                  </label>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => removeShoppingItem(item.id)}
                  >
                    הסרה
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activePage === 'bmi' && (
          <section className="card">
            <h2>מחשבון BMI</h2>

            <form className="form-row" onSubmit={calculateBmi}>
              <label>
                משקל בקילוגרמים (ק"ג)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={bmiForm.weightKg}
                  onChange={(event) => handleBmiFieldChange('weightKg', event.target.value)}
                />
                {bmiErrors.weightKg && <span className="input-error">{bmiErrors.weightKg}</span>}
              </label>

              <label>
                גובה בסנטימטרים (ס"מ)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={bmiForm.heightCm}
                  onChange={(event) => handleBmiFieldChange('heightCm', event.target.value)}
                />
                {bmiErrors.heightCm && <span className="input-error">{bmiErrors.heightCm}</span>}
              </label>

              <button type="submit">חישוב BMI</button>
            </form>

            {healthyWeightRange && (
              <p className="range-text">
                טווח המשקל התקין עבורך הוא בין {healthyWeightRange.min} ק"ג ל-{healthyWeightRange.max}{' '}
                ק"ג.
              </p>
            )}

            {bmiResult && (
              <article className="bmi-result-card">
                <h3>
                  ערך BMI שלך: <span>{bmiResult.bmiValue.toFixed(1)}</span>
                </h3>
                <p>
                  קטגוריה: <strong>{bmiResult.category.title}</strong>
                </p>
                <p>{bmiResult.category.description}</p>
                <p className="bmi-message">{bmiResult.message}</p>

                <div className="bmi-scale-wrap" aria-label="סרגל BMI">
                  <div className="bmi-scale">
                    <div className="segment blue" title="תת-משקל" />
                    <div className="segment green" title="משקל תקין" />
                    <div className="segment orange" title="עודף משקל" />
                    <div className="segment red" title="השמנה" />
                    <div className="bmi-marker" style={{ left: `${bmiResult.markerPercent}%` }} />
                  </div>
                  <div className="bmi-scale-labels">
                    <span>10</span>
                    <span>18.5</span>
                    <span>24.9</span>
                    <span>29.9</span>
                    <span>45+</span>
                  </div>
                </div>

                <p className="bmi-disclaimer">
                  BMI הוא מדד כללי בלבד ואינו מתחשב במסת שריר, מבנה גוף, גיל או גורמים רפואיים נוספים.
                </p>
              </article>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
