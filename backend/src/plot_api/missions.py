"""Random missions for PLOT (source: «Список місій 2.0.docx»)."""

import random
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from plot_api.auth import get_current_user


router = APIRouter(prefix="/missions", tags=["Missions"])

Category = Literal[
    "sport",
    "good_deeds",
    "mental_health",
    "education",
    "household",
    "creativity",
]
Difficulty = Literal["easy", "medium", "hard"]


class MissionResponse(BaseModel):
    id: int
    title: str
    description: str
    category: Category
    difficulty: Difficulty
    xp: int


# Titles, difficulty and XP are provisional; descriptions come from the document.
MISSIONS: list[MissionResponse] = [
    MissionResponse(
        id=1,
        title="Маршрут-фігура",
        description=(
            "Пройди або пробіжи маршрут у формі сердечка, зірки, або "
            "будь-якої іншої цікавої фігури."
        ),
        category="sport",
        difficulty="medium",
        xp=50,
    ),
    MissionResponse(
        id=2,
        title="Планка з віршем",
        description=(
            "Спробуй протриматися в планці стільки часу, скільки "
            "знадобиться, щоб прочитати вголос один короткий вірш, жарт, "
            "скоромовку, або абзац тексту."
        ),
        category="sport",
        difficulty="easy",
        xp=30,
    ),
    MissionResponse(
        id=3,
        title="Книжка на голові",
        description=(
            "Пройдися по кімнаті, тримаючи на голові книжку, і зроби 15 "
            "присідань так, щоб вона не впала."
        ),
        category="sport",
        difficulty="hard",
        xp=80,
    ),
    MissionResponse(
        id=4,
        title="Записка для незнайомця",
        description=(
            "Залиш у публічному місці (на лавці в парку, на столі в "
            "кав'ярні) записку з теплим побажанням для випадкового "
            "незнайомця."
        ),
        category="good_deeds",
        difficulty="easy",
        xp=30,
    ),
    MissionResponse(
        id=5,
        title="Спостереження за птахами",
        description=(
            "Постав за вікном жменю насіння і спостерігай за першим птахом, "
            "який прилетить."
        ),
        category="good_deeds",
        difficulty="easy",
        xp=30,
    ),
    MissionResponse(
        id=6,
        title="Послання собі в майбутнє",
        description=(
            "Напиши текст або запиши аудіоповідомлення тривалістю 2 хвилини "
            "самому собі через 5 років і закинь його в архів або на пошту з "
            "відкладеною відправкою."
        ),
        category="mental_health",
        difficulty="medium",
        xp=50,
    ),
    MissionResponse(
        id=7,
        title="Повернення в дитинство",
        description=(
            "Приділи 15 хвилин заняттю, яке ти дуже любив у дитинстві "
            "(пускати кораблики, пускати мильні бульбашки, будувати хатку з "
            "подушок)."
        ),
        category="mental_health",
        difficulty="easy",
        xp=30,
    ),
    MissionResponse(
        id=8,
        title="10 речей у дорогу",
        description=(
            "Уяви, що тобі потрібно негайно виїхати і напиши список 10 "
            "речей, які ти зі собою візьмеш, і усвідом, чому саме вони."
        ),
        category="mental_health",
        difficulty="medium",
        xp=50,
    ),
    MissionResponse(
        id=9,
        title="10 мрій на майбутнє",
        description=(
            "Напиши список із 10 речей, які хотів б спробувати хоча б раз у "
            "житті."
        ),
        category="mental_health",
        difficulty="easy",
        xp=30,
    ),
    MissionResponse(
        id=10,
        title="Пісня для плейлісту",
        description="Знайди нову пісню, яка підходить для твого плейлісту.",
        category="mental_health",
        difficulty="easy",
        xp=30,
    ),
    MissionResponse(
        id=11,
        title="Вікіпедія-квест",
        description=(
            "Зайди на випадкову статтю Вікіпедії й спробуй переміщуватися "
            "тільки по внутрішніх посиланнях, щоб дійти до статті про свою "
            "любиму музичну групу, актора, або будь-яку історичну постать "
            "(наприклад, Альберт Ейнштейн)"
        ),
        category="education",
        difficulty="hard",
        xp=80,
    ),
    MissionResponse(
        id=12,
        title="Фото в кімнаті",
        description=(
            "Професіонально сфотографуй будь-яку річ у своїй кімнаті "
            "(налаштуй цікаво світло, спробуй різні ефекти, фільтри)."
        ),
        category="education",
        difficulty="medium",
        xp=50,
    ),
    MissionResponse(
        id=13,
        title="Фраза п’ятьма мовами",
        description=(
            "Вивчи одну й ту саму фразу (наприклад, \"Дуже дякую\" або \"Я "
            "люблю алгоритмізацію і програмування\") 5 різними мовами."
        ),
        category="education",
        difficulty="medium",
        xp=50,
    ),
    MissionResponse(
        id=14,
        title="Місто сто років тому",
        description=(
            "Знайди в інтернеті фото своєї вулиці чи міста 100-річної "
            "давнини й порівняй, що саме змінилося на цій локації."
        ),
        category="education",
        difficulty="medium",
        xp=50,
    ),
    MissionResponse(
        id=15,
        title="П’ять діалектизмів",
        description=(
            "Знайди й вивчи 5 цікавих діалектизмів або рідкісних слів з "
            "різних регіонів своєї країни."
        ),
        category="education",
        difficulty="medium",
        xp=50,
    ),
    MissionResponse(
        id=16,
        title="Зашифруй послання",
        description=(
            "Зашифруй своє ім'я або послання за допомогою азбуки Морзе чи "
            "шрифту Брайля."
        ),
        category="education",
        difficulty="easy",
        xp=30,
    ),
    MissionResponse(
        id=17,
        title="Онлайн-тест",
        description=(
            "Пройди онлайн-тест на загальні знання та дізнайся свій "
            "результат."
        ),
        category="education",
        difficulty="easy",
        xp=30,
    ),
    MissionResponse(
        id=18,
        title="Нова страва",
        description=(
            "Приготуй нову страву за рецептом, який раніше ніколи не "
            "куштував."
        ),
        category="household",
        difficulty="medium",
        xp=50,
    ),
    MissionResponse(
        id=19,
        title="Новий затишок",
        description=(
            "Зроби перепланування або перестановку дрібних елементів декору "
            "в кімнаті, щоб створити більш затишну атмосферу."
        ),
        category="household",
        difficulty="easy",
        xp=30,
    ),
    MissionResponse(
        id=20,
        title="Бюджет на тиждень",
        description=(
            "Створи власний бюджет на тиждень: запиши заплановані витрати та "
            "визнач пріоритети."
        ),
        category="household",
        difficulty="medium",
        xp=50,
    ),
    MissionResponse(
        id=21,
        title="Малюнок наосліп",
        description=(
            "Намалюй будь-що (автопортрет, робочий стіл, випадкову річ з "
            "кімнати) не дивлячись на папір."
        ),
        category="creativity",
        difficulty="easy",
        xp=30,
    ),
    MissionResponse(
        id=22,
        title="Логотип для улюбленця",
        description=(
            "Придумай і намалюй логотип для власного домашнього улюбленця "
            "або вигаданої компанії."
        ),
        category="creativity",
        difficulty="medium",
        xp=50,
    ),
    MissionResponse(
        id=23,
        title="Кіт із геометричних фігур",
        description="Намалюй кота використовуючи лише геометричні фігури.",
        category="creativity",
        difficulty="easy",
        xp=30,
    ),
    MissionResponse(
        id=24,
        title="Власний проєкт",
        description=(
            "Придумай власний проєкт та розроби план його реалізації."
        ),
        category="creativity",
        difficulty="hard",
        xp=80,
    ),
]


@router.get(
    "/random",
    response_model=MissionResponse,
    dependencies=[Depends(get_current_user)],
)
def get_random_mission(
    category: Category | None = None,
    difficulty: Difficulty | None = None,
) -> MissionResponse:
    """Select one mission, optionally filtered by category and difficulty."""
    matching_missions = [
        mission
        for mission in MISSIONS
        if (category is None or mission.category == category)
        and (difficulty is None or mission.difficulty == difficulty)
    ]

    if not matching_missions:
        raise HTTPException(
            status_code=404, detail="No matching missions available"
        )

    return random.choice(matching_missions)
