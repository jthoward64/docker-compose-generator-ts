type ListSetter<T> = (values: T[]) => void;

export const createListCollector = <T>(setter: ListSetter<T>) => {
  const values: T[] = [];
  const flush = () => setter([...values]);

  return {
    add: (value: T) => {
      values.push(value);
      flush();
    },
    addMany: (incoming: Iterable<T>) => {
      for (const value of incoming) values.push(value);
      flush();
    },
    values: () => values,
  };
};

type MapSetter<T> = (values: Record<string, T>) => void;

export const createMapCollector = <T>(setter: MapSetter<T>) => {
  const values: Record<string, T> = {};
  const flush = () => setter({ ...values });

  return {
    set: (key: string, value: T) => {
      values[key] = value;
      flush();
    },
    values: () => values,
  };
};
