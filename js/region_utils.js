var region_utils = (function(){
    var module = {};

    module.REGION_BY_CODE = {
        "80": {name: "Київ", short_name: "Київ", code: "80"},
        "12": {name: "Дніпропетровська область", short_name: "Дніпропетровська", code: "12"},
        "51": {name: "Одеська область", short_name: "Одеська", code: "51"},
        "32": {name: "Київська область", short_name: "Київська", code: "32"},
        "63": {name: "Харківська область", short_name: "Харківська", code: "63"},
        "46": {name: "Львівська область", short_name: "Львівська", code: "46"},
        "14": {name: "Донецька область", short_name: "Донецька", code: "14"},
        "23": {name: "Запорізька область", short_name: "Запорізька", code: "23"},
        "05": {name: "Вінницька область", short_name: "Вінницька", code: "05"},
        "53": {name: "Полтавська область", short_name: "Полтавська", code: "53"},
        "71": {name: "Черкаська область", short_name: "Черкаська", code: "71"},
        "68": {name: "Хмельницька область", short_name: "Хмельницька", code: "68"},
        "18": {name: "Житомирська область", short_name: "Житомирська", code: "18"},
        "26": {name: "Івано-Франківська область", short_name: "Івано-Франківська", code: "26"},
        "48": {name: "Миколаївська область", short_name: "Миколаївська", code: "48"},
        "56": {name: "Рівненська область", short_name: "Рівненська", code: "56"},
        "07": {name: "Волинська область", short_name: "Волинська", code: "07"},
        "61": {name: "Тернопільська область", short_name: "Тернопільська", code: "61"},
        "35": {name: "Кіровоградська область", short_name: "Кіровоградська", code: "35"},
        "59": {name: "Сумська область", short_name: "Сумська", code: "59"},
        "74": {name: "Чернігівська область", short_name: "Чернігівська", code: "74"},
        "65": {name: "Херсонська область", short_name: "Херсонська", code: "65"},
        "21": {name: "Закарпатська область", short_name: "Закарпатська", code: "21"},
        "44": {name: "Луганська область", short_name: "Луганська", code: "44"},
        "73": {name: "Чернівецька область", short_name: "Чернівецька", code: "73"},
        "01": {name: "АР Крим", short_name: "АР Крим", code: "01"},
        "85": {name: "Севастополь", short_name: "Севастополь", code: "85"}
    };
    
    module.REGION_SHORT_BY_CODE = Object.keys(module.REGION_BY_CODE).reduce(function(o,key,i){
        o[key] = module.REGION_BY_CODE[key].short_name;
        return o; 
    }, {});
    
    return module;
})();