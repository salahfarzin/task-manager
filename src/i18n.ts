import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      'app.title': 'Task Manager',
      'app.boards': 'Boards',
      'app.myTasks': 'My Tasks',

      // Board
      'board.addList': 'Add List',
      'board.listTitle': 'List Title',
      'board.addCard': 'Add Card',
      'board.deleteList': 'Delete List',
      'board.new': 'New Board',
      'board.new.placeholder': 'Board name...',
      'board.select': 'Select Board',

      // Task Card
      'task.title': 'Task Title',
      'task.description': 'Description',
      'task.addDescription': 'Add a more detailed description...',
      'task.tags': 'Tags',
      'task.addTag': 'Add Tag',
      'task.attachments': 'Attachments',
      'task.addAttachment': 'Add Attachment',
      'task.mentions': 'Mentions',
      'task.createdAt': 'Created',
      'task.estimation': 'Estimation (Hours)',
      'task.assignee': 'Assignee',
      'task.updatedAt': 'Updated',
      'task.delete': 'Delete Task',
      'task.save': 'Save',
      'task.cancel': 'Cancel',
      'task.edit': 'Edit',

      // Actions
      'action.create': 'Create',
      'action.update': 'Update',
      'action.delete': 'Delete',
      'action.cancel': 'Cancel',
      'action.save': 'Save',
      'action.edit': 'Edit',
      'action.close': 'Close',

      // Theme
      'theme.light': 'Light',
      'theme.dark': 'Dark',
      'theme.toggle': 'Toggle Theme',

      // Language
      'language.english': 'English',
      'language.persian': 'Persian',
      'language.toggle': 'Toggle Language',

      // Placeholders
      'placeholder.taskTitle': 'Enter task title...',
      'placeholder.listName': 'Enter list name...',
      'placeholder.searchTasks': 'Search tasks...',
      'placeholder.addComment': 'Add a comment...',

      // Messages
      'message.taskCreated': 'Task created successfully',
      'message.taskUpdated': 'Task updated successfully',
      'message.taskDeleted': 'Task deleted successfully',
      'message.dragToReorder': 'Drag to reorder',
    },
  },
  fa: {
    translation: {
      // Navigation
      'app.title': 'مدیریت وظایف',
      'app.boards': 'تخته‌ها',
      'app.myTasks': 'وظایف من',

      // Board
      'board.addList': 'افزودن لیست',
      'board.listTitle': 'عنوان لیست',
      'board.addCard': 'افزودن کارت',
      'board.deleteList': 'حذف لیست',
      'board.new': 'تخته جدید',
      'board.new.placeholder': 'نام تخته...',
      'board.select': 'انتخاب تخته',

      // Task Card
      'task.title': 'عنوان وظیفه',
      'task.description': 'توضیحات',
      'task.addDescription': 'توضیحات بیشتری اضافه کنید...',
      'task.tags': 'برچسب‌ها',
      'task.addTag': 'افزودن برچسب',
      'task.attachments': 'پیوست‌ها',
      'task.addAttachment': 'افزودن پیوست',
      'task.mentions': 'اشاره‌ها',
      'task.createdAt': 'ایجاد شده',
      'task.updatedAt': 'به‌روزرسانی شده',
      'task.delete': 'حذف وظیفه',
      'task.save': 'ذخیره',
      'task.cancel': 'لغو',
      'task.edit': 'ویرایش',

      // Actions
      'action.create': 'ایجاد',
      'action.update': 'به‌روزرسانی',
      'action.delete': 'حذف',
      'action.cancel': 'لغو',
      'action.save': 'ذخیره',
      'action.edit': 'ویرایش',
      'action.close': 'بستن',

      // Theme
      'theme.light': 'روشن',
      'theme.dark': 'تیره',
      'theme.toggle': 'تغییر تم',

      // Language
      'language.english': 'English',
      'language.persian': 'فارسی',
      'language.toggle': 'تغییر زبان',

      // Placeholders
      'placeholder.taskTitle': 'عنوان وظیفه را وارد کنید...',
      'placeholder.listName': 'نام لیست را وارد کنید...',
      'placeholder.searchTasks': 'جستجوی وظایف...',
      'placeholder.addComment': 'نظر اضافه کنید...',

      // Messages
      'message.taskCreated': 'وظیفه با موفقیت ایجاد شد',
      'message.taskUpdated': 'وظیفه با موفقیت به‌روزرسانی شد',
      'message.taskDeleted': 'وظیفه با موفقیت حذف شد',
      'message.dragToReorder': 'برای مرتب‌سازی مجدد بکشید',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
