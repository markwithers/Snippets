namespace NancyTest
{
    using System;
    using System.Collections;
    using System.Linq;
    using System.Reflection;
    using System.Text.RegularExpressions;

    using Nancy;
    using Nancy.ModelBinding;
    using Nancy.ModelBinding.DefaultConverters;

    /// <summary>
    /// Sample model binder that manually binds customer models
    /// </summary>
    public class CustomModelBinder : IModelBinder
    {
        /// <summary>
        /// Determines whether this instance can bind the specified model type.
        /// </summary>
        /// <param name="modelType">Type of the model.</param>
        /// <returns>
        /// <c>true</c> if this instance can bind the specified model type; otherwise, <c>false</c>.
        /// </returns>
        public bool CanBind(Type modelType)
        {
            return true;
        }

        public object Bind(NancyContext context, Type modelType, object instance = null, params string[] blackList)
        {
            var parentObject = Activator.CreateInstance(modelType);

            foreach (var key in context.Request.Form)
            {
                var value = context.Request.Form[key];
                this.SetObjectValue(parentObject, modelType, null, key, value);
            }

            return parentObject;
        }

        /// <summary>
        /// Sets the object value.
        /// </summary>
        /// <param name="instance">The instance.</param>
        /// <param name="type">The type.</param>
        /// <param name="parentIndex">Index of the parent.</param>
        /// <param name="key">Name of the property.</param>
        /// <param name="propertyValue">The property value.</param>
        private void SetObjectValue(object instance, Type type, int? parentIndex, string key, string propertyValue)
        {
            if (parentIndex.HasValue)
            {
                try
                {
                    var collectionAsList = instance as IList;
                    if (collectionAsList != null)
                    {
                        var item = collectionAsList[parentIndex.Value];

                        type = item.GetType();
                        instance = item;
                    }
                    else
                    {
                        var item = this.InsertAt(instance, parentIndex.Value);

                        type = item.GetType();
                        instance = item;
                    }
                }
                catch
                {
                    var item = this.InsertAt(instance, parentIndex.Value);

                    type = item.GetType();
                    instance = item;
                }
            }

            if (key.Contains("."))
            {
                this.SetObjectValueDeep(instance, type, key, propertyValue);
            }

            var propertyInfo = type.GetProperty(key);
            if (propertyInfo == null)
            {
                return;
            }

            if (propertyInfo.PropertyType == typeof(DateTime?) && string.IsNullOrWhiteSpace(propertyValue))
            {
                propertyValue = null;
            }

            var result = new FallbackConverter().Convert(propertyValue, propertyInfo.PropertyType, null);
            propertyInfo.SetValue(instance, result, null);
        }

        /// <summary>
        /// Sets the object value deep.
        /// </summary>
        /// <param name="instance">The instance.</param>
        /// <param name="type">The type.</param>
        /// <param name="key">The key.</param>
        /// <param name="propertyValue">The property value.</param>
        private void SetObjectValueDeep(object instance, Type type, string key, string propertyValue)
        {
            var propList = key.Split('.').ToList();

            var parent = propList.First();
            int? index = null;

            if (parent.Contains("["))
            {
                var match = Regex.Match(parent, @"\[(\d*)\]");

                index = int.Parse(match.Groups[1].Value);
                parent = parent.Replace(match.Value, string.Empty);
            }

            var propertyInfo = type.GetProperty(parent);
            if (propertyInfo == null)
            {
                return;
            }

            var childObject = propertyInfo.GetValue(instance, null);

            if (childObject == null)
            {
                if (propertyInfo.PropertyType.IsInterface)
                {
                    var allTypes = AppDomain.CurrentDomain.GetAssemblies().SelectMany(t => t.GetTypes());

                    var possibleTypes = allTypes.Where(t =>
                            t.IsClass
                            && !t.IsInterface
                            && !t.IsAbstract
                            && t.GetInterface(propertyInfo.PropertyType.Name) != null);

                    foreach (var concreteType in possibleTypes)
                    {
                        if (concreteType.IsGenericType)
                        {
                            var interf = concreteType.GetInterface(propertyInfo.PropertyType.Name);

                            if (interf.GetGenericTypeDefinition() == propertyInfo.PropertyType.GetGenericTypeDefinition())
                            {
                                var genericType = propertyInfo.PropertyType.GetGenericArguments().FirstOrDefault();

                                var typeToCreate = concreteType.MakeGenericType(genericType);

                                childObject = Activator.CreateInstance(typeToCreate);
                                break;
                            }
                        }
                        else
                        {
                            if (propertyInfo.PropertyType.IsAssignableFrom(concreteType))
                            {
                                childObject = Activator.CreateInstance(concreteType);
                                break;
                            }
                        }
                    }
                }
                else
                {
                    childObject = Activator.CreateInstance(propertyInfo.PropertyType);
                }

                propertyInfo.SetValue(instance, childObject, null);
            }

            propList.RemoveAt(0);

            var newKey = propList.Aggregate(string.Empty, (current, prop) => current + (prop + ".")).TrimEnd('.');

            if (childObject != null)
            {
                this.SetObjectValue(childObject, childObject.GetType(), index, newKey, propertyValue);
            }
        }

        /// <summary>
        /// Inserts at.
        /// </summary>
        /// <param name="list">The list.</param>
        /// <param name="index">The index.</param>
        /// <returns>The item inserted into the list</returns>
        private object InsertAt(object list, int index)
        {
            var genericType = list.GetType().GetGenericArguments().First();
            var item = Activator.CreateInstance(genericType);

            var collectionInsertMethod = list.GetType().GetMethod("Insert", BindingFlags.Public | BindingFlags.Instance);

            try
            {
                collectionInsertMethod.Invoke(list, new[] { index, item });
            }
            catch
            {
                item = this.InsertAllItemsUpToIndex(list, index);
            }

            return item;
        }

        /// <summary>
        /// Inserts blank items into all the items up to and including the supplied index
        /// </summary>
        /// <param name="list">The list.</param>
        /// <param name="index">The index.</param>
        /// <returns>The item insert into the list</returns>
        private object InsertAllItemsUpToIndex(object list, int index)
        {
            var item = new object();
            int i = 0;

            while (i <= index)
            {
                try
                {
                    var collectionAsList = list as IList;
                    if (collectionAsList != null)
                    {
                        item = collectionAsList[index];
                    }
                }
                catch
                {
                    var genericType = list.GetType().GetGenericArguments().First();
                    item = Activator.CreateInstance(genericType);

                    var collectionInsertMethod = list.GetType().GetMethod("Insert", BindingFlags.Public | BindingFlags.Instance);

                    collectionInsertMethod.Invoke(list, new[] { i, item });

                    if (i == index)
                    {
                        return item;
                    }
                }

                i++;
            }

            return item;
        }
    }
}