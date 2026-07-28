document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const seatingNoInput = document.getElementById('seatingNo');
  const searchBtn = document.getElementById('searchBtn');
  const btnText = searchBtn.querySelector('.btn-text');
  const btnSpinner = searchBtn.querySelector('.btn-spinner');
  
  const validationError = document.getElementById('validationError');
  const skeletonLoader = document.getElementById('skeletonLoader');
  const resultsCard = document.getElementById('resultsCard');
  const errorCard = document.getElementById('errorCard');
  
  // Results Elements
  const resStudentName = document.getElementById('resStudentName');
  const resSeatingNo = document.getElementById('resSeatingNo');
  const resBadge = document.getElementById('resBadge');
  const resScore = document.getElementById('resScore');
  const resPercent = document.getElementById('resPercent');
  const resStatusDesc = document.getElementById('resStatusDesc');
  const radialBar = document.getElementById('radialBar');
  const radialWrapper = radialBar.closest('.radial-progress-wrapper');
  
  // Action Buttons
  const printBtn = document.getElementById('printBtn');
  const resetBtn = document.getElementById('resetBtn');
  const errorResetBtn = document.getElementById('errorResetBtn');

  // SVG Circumference for radial progress (2 * PI * r, where r = 42 is 263.89)
  const CIRCUMFERENCE = 264;
  radialBar.style.strokeDasharray = CIRCUMFERENCE;
  radialBar.style.strokeDashoffset = CIRCUMFERENCE;

  // Form Submission
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const value = seatingNoInput.value.trim();
    
    // Reset Views
    hideElement(validationError);
    hideElement(resultsCard);
    hideElement(errorCard);
    
    // Validation
    if (!value) {
      showValidationError('يرجى إدخال رقم الجلوس أولاً.');
      return;
    }
    
    if (!/^\d+$/.test(value)) {
      showValidationError('رقم الجلوس يجب أن يحتوي على أرقام فقط.');
      return;
    }
    
    if (value.length < 5 || value.length > 10) {
      showValidationError('رقم الجلوس غير منطقي. يرجى إدخال رقم جلوس صحيح.');
      return;
    }

    // Start Search
    setLoadingState(true);
    
    try {
      const response = await fetch(`/api/student?seating_no=${value}`);
      const data = await response.json();
      
      // Artificial delay to make transitions feel smoother and highlight premium animations
      await new Promise(resolve => setTimeout(resolve, 600));

      if (response.ok && data.success) {
        displayResults(data.student);
      } else {
        if (response.status === 404) {
          showErrorView('رقم الجلوس غير صحيح', 'لم نتمكن من العثور على أي طالب مسجل برقم الجلوس هذا. يرجى التحقق من الرقم والمحاولة مرة أخرى.');
        } else {
          showErrorView('فشل الاتصال بالخادم', data.error || 'حدث خطأ غير متوقع أثناء استرجاع البيانات.');
        }
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      showErrorView('خطأ في الشبكة', 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
    } finally {
      setLoadingState(false);
    }
  });

  // Display Student Result
  function displayResults(student) {
    resStudentName.textContent = student.arabic_name;
    resSeatingNo.textContent = student.seating_no;
    resScore.textContent = student.total_degree;
    resStatusDesc.textContent = student.student_case_desc;
    
    // Percentage Calculation (Max is 320.0)
    const rawDegree = parseFloat(student.total_degree);
    let percentage = 0;
    if (!isNaN(rawDegree) && rawDegree > 0) {
      percentage = parseFloat(((rawDegree / 320.0) * 100).toFixed(2));
      // Cap at 100% just in case of any anomaly
      if (percentage > 100) percentage = 100;
    }
    
    resPercent.textContent = `${percentage}%`;
    
    // Status Badge Logic
    resBadge.className = 'status-badge';
    radialWrapper.className = 'radial-progress-wrapper';
    
    const caseText = student.student_case_desc;
    
    if (caseText.includes('ناجح')) {
      resBadge.classList.add('pass');
      resBadge.textContent = 'ناجح';
      radialWrapper.classList.add('pass');
    } else if (caseText.includes('دور ثان') || caseText.includes('دور ثاني')) {
      resBadge.classList.add('resit');
      resBadge.textContent = 'دور ثان';
      radialWrapper.classList.add('resit');
    } else if (caseText.includes('راسب')) {
      resBadge.classList.add('fail');
      resBadge.textContent = 'راسب';
      radialWrapper.classList.add('fail');
    } else if (caseText.includes('غياب')) {
      resBadge.classList.add('fail');
      resBadge.textContent = 'غياب كلي';
      radialWrapper.classList.add('fail');
    } else {
      resBadge.classList.add('pass');
      resBadge.textContent = 'مكتمل';
      radialWrapper.classList.add('pass');
    }
    
    // Animate Radial Progress
    // We delay the stroke offset transition slightly to let the card fade-in animation play first
    radialBar.style.strokeDashoffset = CIRCUMFERENCE; // Reset
    setTimeout(() => {
      const offset = CIRCUMFERENCE - (CIRCUMFERENCE * percentage) / 100;
      radialBar.style.strokeDashoffset = offset;
    }, 150);
    
    showElement(resultsCard);
    
    // Smooth scroll to results
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Error Card Rendering
  function showErrorView(title, message) {
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorMessage').textContent = message;
    showElement(errorCard);
    errorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Loading States
  function setLoadingState(isLoading) {
    if (isLoading) {
      // Disable inputs
      seatingNoInput.disabled = true;
      searchBtn.disabled = true;
      btnText.classList.add('hidden');
      btnSpinner.classList.remove('hidden');
      
      showElement(skeletonLoader);
    } else {
      // Enable inputs
      seatingNoInput.disabled = false;
      searchBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnSpinner.classList.add('hidden');
      
      hideElement(skeletonLoader);
    }
  }

  // Input Validation Error
  function showValidationError(message) {
    validationError.textContent = message;
    showElement(validationError);
  }

  // Action listeners
  resetBtn.addEventListener('click', resetSearch);
  errorResetBtn.addEventListener('click', resetSearch);

  function resetSearch() {
    seatingNoInput.value = '';
    hideElement(resultsCard);
    hideElement(errorCard);
    hideElement(validationError);
    seatingNoInput.focus();
  }

  // Print Logic
  printBtn.addEventListener('click', () => {
    window.print();
  });

  // Helpers
  function showElement(el) { el.classList.remove('hidden'); }
  function hideElement(el) { el.classList.add('hidden'); }
});
