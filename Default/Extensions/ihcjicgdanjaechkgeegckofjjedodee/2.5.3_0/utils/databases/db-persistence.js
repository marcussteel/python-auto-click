import{DB_NAMES_BLOOM,DB_NAMES_RAW,REGEX_DBS,DB_DIR,DB_NAME_FEATURE_FLAGS}from"./db-consts";import{IndexedDatabase}from"./indexed-database";import{IndexedDatabaseFile}from"./indexed-database-file";import{isIndexedDbAvailable,cleanDbName,objToBinary}from"../utils";import{simpleStorageGet,simpleStorageSet}from"../storage";import{getObjs as getObjsIndexedDb,saveObjs as saveObjsIndexedDb}from"../indexed-db";import{fileWrite,queuedFileRead}from"../file";const bundledDbVersions=require("../../db/version.json"),parseDbsParameter=e=>{const a=new Set(e),o=DB_NAMES_BLOOM.filter((e=>a.has(e))),s=DB_NAMES_RAW.filter((e=>a.has(e))),n=o.map((e=>({name:e,cleanName:cleanDbName(e),isBloom:!0,isFeatureFlags:!1}))).concat(s.map((e=>({name:e,cleanName:cleanDbName(e),isBloom:!1,isFeatureFlags:!1}))));return a.has(DB_NAME_FEATURE_FLAGS)&&n.push({name:DB_NAME_FEATURE_FLAGS,cleanName:cleanDbName(DB_NAME_FEATURE_FLAGS),isBloom:!1,isFeatureFlags:!0}),n};export const loadBundledDatabases=async e=>{console.debug("LBD: Forcing reading bundled databases at "+(new Date).toLocaleString()),console.debug("LBD: Databases to be loaded:",e);const a=parseDbsParameter(e),o=[];a.forEach((e=>{o.push(loadBunldedDb(e.name,e.isBloom,e.isFeatureFlags))}));const s=[];return(await Promise.all(o)).forEach((e=>{s.push(buildDbResult(e,bundledDbVersions[e.name].version))})),console.debug("LBD: Bundled unpack complete at "+(new Date).toLocaleString()),console.log(`LBD: ${s.length} bundled databases loaded`),s};export const loadCachedDatabases=async e=>{if(!isIndexedDbAvailable())return console.warn("LCD: IndexedDB not available in this browser"),[];const a=parseDbsParameter(e),o=await getObjsIndexedDb({dbName:"cachedDb",storeName:"cachedDbStore",storeOptions:{keyPath:"dbName"},waitStrategy:"allSettled",keys:a.map((e=>e.cleanName))}),s=[];o.forEach(((e,o)=>{const n=a[o];if("rejected"===e.status)return void console.warn(`LCD: Error loading ${n.name} from the cache`,e.reason);if("fulfilled"!==e.status)return void console.warn(`LCD: ${n.name} not loaded from cache`);const r=e.value;r?r.dbName&&r.data?(console.debug(`LCD: ${n.name} read from cache.`),s.push(buildDbResult({name:n.name,isBloom:n.isBloom,isFeatureFlags:n.isFeatureFlags,isRaw:!n.isBloom,result:n.isBloom?new IndexedDatabase(n.name,r.data.bloomFilter):r.data},r.version))):console.debug(`LCD: No cache db for ${n.name}.`,n.name):console.warn(`LCD: ${n.name} not loaded from cache`)}));const n=s.filter((e=>!e.version));if(n.length>0){console.warn(`LCD: Found ${n.length} dbs with no version in the cache, querying simpleStorage to get the version`),console.debug("LCD: Cache databases with no version",n.map((e=>e.name)));const e=await simpleStorageGet("databases")||{};n.forEach((a=>{a.version=e[a.name]&&e[a.name].version,console.debug(`LCD: Version for ${a.name}:`,a.version)}));const a=n.filter((e=>e.version));a.length>0&&(console.debug(`LCD: Re-writing ${a.length} databases in the cache, version was set`),await saveDbsToCache(a))}return console.log(`LCD: ${s.length} databases loaded from the cache`),s};export const saveDbsToCache=async e=>{if(!isIndexedDbAvailable())return console.warn("SDTC: IndexedDB not available in this browser"),!1;var a=e.map((e=>{let a;return a=e.rawData?e.rawData:e.data instanceof Set?Array.from(e.data):e.data,{dbName:e.cleanName,data:a,version:e.version}}));return await saveObjsIndexedDb({dbName:"cachedDb",storeName:"cachedDbStore",storeOptions:{keyPath:"dbName"},values:a}),!0};export const loadIdbStorageDatabases=async e=>{if(!isIndexedDbAvailable())return console.warn("LISD: IndexedDB not available in this browser"),[];const a=parseDbsParameter(e),o=[];a.forEach((e=>{o.push(loadIdbStorageDb(e.name,e.isBloom,e.isFeatureFlags))}));const s=[];(await Promise.allSettled(o)).forEach(((e,o)=>{const n=a[o];if("rejected"==e.status)return void console.warn(`LISD: Error loading ${n.name} from the IdbStorage`,e.reason);const r=e.value;s.push(buildDbResult(r,r.version))}));const n=s.filter((e=>!e.version));if(n.length>0){console.warn(`LISD: Found ${n.length} dbs with no version file, querying simpleStorage to get the version`),console.debug("LISD: Databases with no version",n.map((e=>e.name)));const e=await simpleStorageGet("databases")||{},a=[];if(n.forEach((o=>{o.version=e[o.name]&&e[o.name].version,console.debug(`LISD: Version for ${o.name}:`,o.version),o.version&&a.push(saveVersionFile(o.name,o.version))})),a.length>0)try{await Promise.all(a),console.debug(`LISD: ${a.length} version files created`)}catch(e){console.error("LISD: Error saving version files",e)}}return console.log(`LBD: ${s.length} databases loaded from IdbStorage`),s};export const saveDownloadedDb=(e,a,o)=>{if(!a)throw new Error("Version is required");return Promise.all([fileWrite(DB_DIR,e,o),saveVersionFile(e,a),simpleStorageSet({idbStorageDatabases:!0})])};const saveVersionFile=(e,a)=>{const o=objToBinary({name:e,version:a});return fileWrite(DB_DIR,`${e}.version`,o)},getVersionFromVersionFile=(e,a)=>{if(a)try{return JSON.parse((new TextDecoder).decode(a)).version}catch(a){return void console.warn(`GVFVF: Error parsing version file for ${e}`,a)}else console.warn(`GVFVF: Version file for ${e} is falsy`,a)},buildDbResult=(e,a)=>{const o={};return o.name=e.name,o.version=a,o.cleanName=cleanDbName(o.name),o.isBloom=e.isBloom,o.isRaw=e.isRaw,o.data=e.result,o.isFeatureFlags=e.isFeatureFlags,"malware_urls"==o.cleanName&&(o.rawData=o.data,o.data=new Set(o.data)),REGEX_DBS.includes(o.cleanName)&&(o.rawData=o.data,o.data=o.data.map((e=>new RegExp(e,"i"))),o.isRegex=!0),o},loadBunldedDb=(e,a,o)=>{const s=a&&new IndexedDatabase(e),n=!a&&new IndexedDatabaseFile(e);return(a?s.parseBundled():n.readBundled()).then((n=>({name:e,isBloom:a,isFeatureFlags:o,isRaw:!a,result:a?s:n})))},loadIdbStorageDb=(e,a,o)=>{const s=a&&new IndexedDatabase(e),n=!a&&new IndexedDatabaseFile(e),r=a?s.parse():n.read();return Promise.allSettled([r,queuedFileRead(`${e}.version`)]).then((n=>{const[r,t]=n;if("rejected"==r.status){if("string"==typeof r.reason)throw new Error(`Error loading ${e} from IdbStorage: ${r.reason}`);throw r.reason}const i=getVersionFromVersionFile(e,t.value);return{name:e,isBloom:a,isFeatureFlags:o,isRaw:!a,result:a?s:r.value,version:i}}))};