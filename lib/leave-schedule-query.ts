type RangeQuery<T> = {
  range(
    from: number,
    to: number,
  ): PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>;
};

export async function readAllScheduleRows<T>(
  query: RangeQuery<T>,
): Promise<T[]> {
  const pageSize = 500;
  const result: T[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await query.range(
      offset,
      offset + pageSize - 1,
    );

    if (error) {
      throw new Error(error.message);
    }

    const rows = data || [];

    result.push(...rows);

    if (rows.length < pageSize) {
      break;
    }
  }

  return result;
}