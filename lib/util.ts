
export const isObject = (obj:any) => typeof obj === 'object' && obj !== null && !Array.isArray(obj);

export const merge = (...objs:any) => objs.reduce((combined:any, obj:any) => {
    let newObj = {...combined};
    Object.keys(obj).forEach((key:string) => {
        if(isObject(obj[key]) && isObject(combined[key])) {
            newObj[key] = merge(combined[key], obj[key]);
        } else {
            newObj[key] = obj[key];
        }
    });
    return newObj;
}, {});

