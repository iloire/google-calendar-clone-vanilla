import { getClosest } from "../../utilities/helpers"
import {
  getDateForStore,
  compareDates,
  getDateFromAttribute,
  isBeforeDate
} from "../../utilities/dateutils";
import setViews from "../../config/setViews";

const datepicker = document.querySelector(".datepicker");
const datepickeroverlay = document.querySelector(".datepicker-overlay")
const datepickerBody = document.querySelector(".datepicker__body--dates");
const datepickerTitle = document.querySelector(".datepicker-title");
const datepickerChangeDate = document.querySelector(".datepicker-change-date")

// prev and next buttons aside from main app header datewrapper
const headerPrevBtn = document.querySelector(".prev")
const headerNextBtn = document.querySelector(".next")

const yearpickerTitle = document.querySelector(".yearpicker-title")
const monthpickerMonths = document.querySelectorAll(".monthpicker__month")


export default function setDatepicker(context, store, datepickerContext, type) {
  let montharray = datepickerContext.getMonthArray();
  let count = 0;
  let hasweek;
  // let currentdate = [];
  let [checkmonth, checkyear] = [null, null];

  function setDatepickerHeader() {
    const y = datepickerContext.getYear()
    const m = datepickerContext.getMonthName()
    datepickerTitle.textContent = `${m} ${y}`
  }

  function createCells(montharray) {
    let groupedEntries = store.getMonthEntryDates(montharray)
    let currentWeekStart = context.getWeek();

    datepickerBody.innerText = "";
    for (let i = 0; i < montharray.length; i++) {
      const cell = document.createElement("div");
      const datename = document.createElement("div");
      cell.classList.add("datepicker__body--dates-cell");
      datename.classList.add("datepicker__body--datename");

      if (montharray[i].getMonth() !== datepickerContext.getMonth()) {
        datename.classList.add("datepicker__body--datename-disabled");
      }

      if (compareDates(montharray[i], currentWeekStart) && context.getComponent() === "week") {
        hasweek = true;
      }

      if (hasweek) {
        count++
        if (count <= 7) {
          cell.classList.add("datepicker__body--dates-week")
        }
      } else {
        cell.classList.remove("datepicker__body--dates-week")
      }

      if (montharray[i].getDate() === context.getDateSelected() && montharray[i].getMonth() === datepickerContext.getMonth()) {
        if (!datename.classList.contains("datepicker__body--datename-today")) {
          datename.setAttribute("class", "datepicker__body--datename")
          datename.classList.add("datepicker__body--datename-selected");
        }
      }

      if (context.isToday(montharray[i])) {
        datename.setAttribute("class", "datepicker__body--datename")
        datename.classList.add("datepicker__body--datename-today");
      }

      datename.innerText = montharray[i].getDate();
      const formattedDate = getDateForStore(montharray[i])

      datename.setAttribute("data-datepicker-date", formattedDate);
      if (groupedEntries.includes(formattedDate)) {
        if (!datename.classList.contains("datepicker__body--datename-today") && !datename.classList.contains("datepicker__body--datename-selected")) {
          datename.setAttribute("class", "datepicker__body--datename")
          datename.classList.add("datepicker__body--datename-entries")
        }
      } else {
        datename.classList.remove("datepicker__body--datename-entries")
      }

      cell.appendChild(datename)
      datepickerBody.appendChild(cell);
    }

    currentWeekStart = null;
    groupedEntries = []
  }

  function closeDatepicker() {
    datepicker.classList.add("hide-datepicker");
    datepickeroverlay.classList.add("hide-datepicker-overlay")
    closeChangeDateModal();
    const formOpen = store.getActiveOverlay().has("hide-form-overlay");
    const listOpen = context.getComponent() !== "list";
    if (listOpen || !formOpen) {
      headerPrevBtn.removeAttribute("style");
      headerNextBtn.removeAttribute("style");
    }
    
    if (type === "form") {
      document.querySelector(".active-form-date")?.classList.remove("active-form-date")
    }
    
    datepickeroverlay.onclick = null;
    document.removeEventListener("keydown", handleKeydownNav)
    montharray = [];
  }

  function renderpicker(y, m, d) {
    context.setDate(y, m, d)
    context.setDateSelected(d)
    setViews(context.getComponent(), context, store, datepickerContext);
    datepickerContext.setDate(y, m, d)
    closeDatepicker()
  }

  function handleFormDate(y, m, d) {
    datepickerContext.setDate(y, m, d)
    context.setDateSelected(d)
    const datepickerDate = datepickerContext.getDate()

    const activeFormDate = document.querySelector(".active-form-date")
    activeFormDate.setAttribute("data-form-date", `${y}-${m}-${d}`)
    activeFormDate.textContent = `${datepickerContext.getMonthName().slice(0, 3)} ${d}, ${y}`

    const inactiveFormDate = document?.querySelector(".inactive-form-date")
    const inactiveValue = inactiveFormDate.getAttribute("data-form-date").split("-").map(x => parseInt(x))
    const inactiveDate = new Date(inactiveValue[0], inactiveValue[1], inactiveValue[2])
    const inactiveDateType = inactiveFormDate.getAttribute("data-form-date-type")

    /**
     * FORM DATEPICKER CONDITIONS
     * 1. if user selects start date that is after end date
     *   -- set end date to start date
     * 2. if user selects end date that is before start date
     *  -- set start date to end date
     */
    if ((isBeforeDate(inactiveDate, datepickerDate) && inactiveDateType === "end") || (isBeforeDate(datepickerDate, inactiveDate) && inactiveDateType === "start")) {
      inactiveFormDate.setAttribute("data-form-date", `${y}-${m}-${d}`)
      inactiveFormDate.textContent = `${datepickerContext.getMonthName().slice(0, 3)} ${d}, ${y}`
    }
  }

  function setNewDate(e) {
    const [y, m, d] = getDateFromAttribute(e.target, "data-datepicker-date")
    if (type === "form") {
      handleFormDate(y, m, d)
      closeDatepicker()
    } else {
      renderpicker(y, m, d)
    }
  }

  function setCheckMonthYear() {
    checkmonth = datepickerContext.getMonth()
    checkyear = datepickerContext.getYear()
  }

  function getMonthYearCheck() {
    return checkmonth === datepickerContext.getMonth() && checkyear === datepickerContext.getYear()
  }
  

  function renderNextMonth() {
    datepickerContext.setNextMonth()
    montharray = datepickerContext.getMonthArray()
    createCells(montharray)
    setDatepickerHeader()
  }

  function renderPrevMonth() {
    datepickerContext.setPrevMonth()
    montharray = datepickerContext.getMonthArray()
    createCells(montharray)
    setDatepickerHeader()
  }

  function setSelectedToNextDay() {
    console.log(datepickerContext.getDateSelected())
  }

  function openChangeDateModal() {
    setCheckMonthYear()
    datepickerChangeDate.classList.add("show-dpcd")
    yearpickerSetYear(null, true);
    monthpickerSetMonth(datepickerContext.getMonth(), true);
    console.log(datepickerContext.getMonth());
  }

  function closeChangeDateModal() {
    // check if date has changed;
    if (!getMonthYearCheck()) {
      console.log(true);
      montharray = datepickerContext.getMonthArray();
      createCells(montharray);
      setDatepickerHeader();
    }
    datepickerChangeDate.classList.remove("show-dpcd");
  }

  function monthpickerSetMonth(val, init) {
    const newmonth = val;

    if (!init && newmonth === datepickerContext.getMonth()) return;
    datepickerContext.setMonth(newmonth);
    monthpickerMonths.forEach((month, idx) => {
      if (idx === newmonth) {
        month.classList.add("monthpicker__active-month")
      } else {
        month.classList.remove("monthpicker__active-month")
      }
    })
  }

  function yearpickerSetYear(increment, init) {
    if (init) {
      yearpickerTitle.textContent = datepickerContext.getYear();
      return;
    }

    const newyear = parseInt(datepickerContext.getYear()) + increment;
    if (newyear == +datepickerContext.getYear()) return;
    datepickerContext.setYear(newyear);
    yearpickerTitle.textContent = newyear;
  }

  function delegateDatepickerEvents(e) {
    const datenumber = getClosest(e, ".datepicker__body--datename");
    const navnext = getClosest(e, ".datepicker-nav--next");
    const navprev = getClosest(e, ".datepicker-nav--prev");
    const title = getClosest(e, ".datepicker-title");
    const closeChangeDateBtn = getClosest(e, ".close-change-date");
    const ypNext = getClosest(e, ".yearpicker-next");
    const ypPrev = getClosest(e, ".yearpicker-prev");
    const mpMonth = getClosest(e, ".monthpicker__month");

    if (datenumber) {
      setNewDate(e);
      return;
    }

    if (navnext) {
      renderNextMonth();
      return;
    }

    if (navprev) {
      renderPrevMonth();
      return;
    }

    if (title) {
      openChangeDateModal();
      return;
    }

    if (closeChangeDateBtn) {
      closeChangeDateModal();
      return;
    }

    if (ypNext) {
      yearpickerSetYear(1, false);
      return;
    }

    if (ypPrev) {
      yearpickerSetYear(-1, false);
      return;
    }

    if (mpMonth) {
      const newmonth = parseInt(e.target.getAttribute("data-dp-month"))
      console.log(newmonth)
      monthpickerSetMonth(newmonth, false);
      return;
    }
  }

  function handleKeydownNav(e) {
    switch (e.key) {
      case "ArrowDown":
        renderPrevMonth();
        break;
      case "ArrowUp":
        renderNextMonth();
        break;
      case "ArrowRight":
        setSelectedToNextDay();
        break;
      case "Escape":
        if (datepickerChangeDate.classList.contains("show-dpcd")) {
          closeChangeDateModal();
        } else {
          closeDatepicker();
        }
        break;
      default:
        break;
    }
  }

  const initDatepicker = () => {
    setDatepickerHeader();
    createCells(montharray);
    store.setResetDatepickerCallback(closeDatepicker)
    datepickeroverlay.onclick = closeDatepicker;
    datepicker.onmousedown = delegateDatepickerEvents;
    document.addEventListener("keydown", handleKeydownNav);
    montharray = [];
  }
  initDatepicker()
}
