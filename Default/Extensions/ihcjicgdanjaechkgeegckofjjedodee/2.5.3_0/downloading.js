window.chrome=chrome||window.chrome||window.browser,window.chrome.runtime.getURL(""),(()=>{"use strict";Object.freeze({LicenseStateUnknown:0,LicenseStateFree:1,LicenseStateTrial:2,LicenseStateTrialExpired:3,LicenseStateLicensed:4,LicenseStateLicenseExpired:5,LicenseStateLicenseGrace:6});let e=window.chrome||window.browser||browser;navigator.userAgent.includes("Edge/")&&(e=window.browser),window.addEventListener("load",(()=>{const n=document.getElementById("downloading");e.runtime.sendMessage({type:"MSG_DOWNLOAD_LOGS",fullLog:!0},(e=>{!e||e.error?n.textContent=`Download Failed. ${e?e.error:"‍"}`:n.textContent="Download complete"}))}))})();